'use client'
import { useState, useEffect, useRef } from 'react'
import { Trash2, Plus, MapPin, CheckCircle2 } from 'lucide-react'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // 🗺️ Map Search States
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)

  // 🛡️ Debounce Timer to save LocationIQ API quota
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  const [settings, setSettings] = useState({
    bankName: '', bankAccountName: '', bankAccountNumber: '',
    paystackPublicKey: '',
    deliveryMode: 'flat', deliveryFee: 1500, deliveryZones: [] as {name: string, fee: number}[],
    fezApiKey: '', freeDeliveryAbove: 10000, 
    restaurantName: '', restaurantPhone: '', restaurantAddress: '',
    restaurantLat: '', restaurantLng: '' 
  })

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setSettings({
            ...data.data,
            deliveryZones: data.data.deliveryZones || []
          })
        }
        setLoading(false)
      })
  }, [])

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  // 🌍 ENTERPRISE MAP: LocationIQ Integration
  const handleStoreAddressSearch = async (query: string) => {
    handleChange('restaurantAddress', query)
    handleChange('restaurantLat', '')
    handleChange('restaurantLng', '')

    if (query.length < 5) {
      setSearchResults([])
      setIsSearchingAddress(false)
      return
    }

    setIsSearchingAddress(true)

    // Clear timer if user is still typing
    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    debounceTimer.current = setTimeout(async () => {
      try {
        const LOCATIONIQ_TOKEN = "pk.e6b3232142dec838e8c4bd962ca5610f" // 👈 PASTE TOKEN HERE

        const res = await fetch(`https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_TOKEN}&format=json&countrycodes=ng&q=${encodeURIComponent(query)}`)
        const data = await res.json()
        
        // Handle LocationIQ's empty state error
        if (data.error) {
          setSearchResults([])
        } else {
          setSearchResults(data.slice(0, 4))
        }
      } catch (err) {
        console.error("Map search failed", err)
      } finally {
        setIsSearchingAddress(false)
      }
    }, 800)
  }

  const selectStoreAddress = (result: any) => {
    handleChange('restaurantAddress', result.display_name)
    handleChange('restaurantLat', result.lat)
    handleChange('restaurantLng', result.lon)
    setSearchResults([])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Settings updated successfully!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 4000)
    }
  }

  if (loading) return <div className="p-6 text-stone-400">Loading settings...</div>

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6">
      <div className="max-w-4xl mx-auto pb-20">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="font-serif text-3xl font-bold text-amber-400">Store Settings</h1>
            <p className="text-stone-500 text-sm mt-1">Configure your Lagos-based restaurant operations.</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {message.text && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium border animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-900/20 text-green-400 border-green-800' : 'bg-red-900/20 text-red-400 border-red-800'}`}>
            {message.text}
          </div>
        )}

        <form className="space-y-8" onSubmit={handleSave}>
          
          {/* 🏪 Store Info Section with Map Search */}
          <div className="bg-stone-900/50 rounded-2xl p-6 border border-stone-800 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 border-b border-stone-800 pb-2 flex items-center gap-2">
               <MapPin size={20} className="text-amber-500"/> Store Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Restaurant Name</label>
                <input value={settings.restaurantName || ''} onChange={e => handleChange('restaurantName', e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:border-amber-500 outline-none transition-colors" placeholder="TableOS Cafe" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Support Phone Number</label>
                <input value={settings.restaurantPhone || ''} onChange={e => handleChange('restaurantPhone', e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:border-amber-500 outline-none transition-colors" placeholder="+234..." />
              </div>
              <div className="md:col-span-2 relative">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Pickup Address (Verified via LocationIQ)</label>
                <div className="relative">
                  <input 
                    value={settings.restaurantAddress || ''} 
                    onChange={e => handleStoreAddressSearch(e.target.value)} 
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:border-amber-500 outline-none transition-colors" 
                    placeholder="Search for your street/area in Lagos..." 
                  />
                  {isSearchingAddress && <div className="absolute right-4 top-3.5 animate-pulse text-amber-500 text-xs">Mapping...</div>}
                </div>
                
                {searchResults.length > 0 && (
                  <div className="absolute z-20 w-full bg-stone-900 border border-stone-700 rounded-xl mt-1 overflow-hidden shadow-2xl">
                    {searchResults.map((result, idx) => (
                      <button 
                        key={idx} 
                        type="button"
                        onClick={() => selectStoreAddress(result)}
                        className="w-full text-left px-4 py-3 text-sm text-stone-300 hover:bg-stone-800 border-b border-stone-800 last:border-0 transition-colors"
                      >
                        {result.display_name}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="mt-3 flex items-center gap-2">
                  {settings.restaurantLat ? (
                    <span className="text-xs text-green-400 flex items-center gap-1 bg-green-900/20 px-2 py-1 rounded-md border border-green-800">
                      <CheckCircle2 size={12}/> GPS Locked ({Number(settings.restaurantLat).toFixed(4)}, {Number(settings.restaurantLng).toFixed(4)})
                    </span>
                  ) : (
                    <span className="text-xs text-stone-500 italic">No GPS coordinates locked yet. Use search above.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 💳 Payment Info */}
          <div className="bg-stone-900/50 rounded-2xl p-6 border border-stone-800 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 border-b border-stone-800 pb-2">💳 Payment Setup</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Paystack Public Key</label>
                <input value={settings.paystackPublicKey || ''} onChange={e => handleChange('paystackPublicKey', e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:border-amber-500 outline-none" placeholder="pk_test_..." />
              </div>
            </div>
          </div>

          {/* 🚚 Delivery Setup */}
          <div className="bg-stone-900/50 rounded-2xl p-6 border border-stone-800 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 border-b border-stone-800 pb-2">🚚 Delivery Logistics</h2>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">Pricing Strategy</label>
              <div className="flex gap-4">
                {['flat', 'zoned', 'auto'].map(mode => (
                  <label key={mode} className="flex items-center gap-3 text-sm cursor-pointer group">
                    <input type="radio" checked={settings.deliveryMode === mode} onChange={() => handleChange('deliveryMode', mode)} className="accent-amber-500 w-4 h-4" />
                    <span className={`capitalize transition-colors ${settings.deliveryMode === mode ? 'text-amber-400 font-bold' : 'text-stone-500 group-hover:text-stone-300'}`}>{mode} Mode</span>
                  </label>
                ))}
              </div>
            </div>

            {settings.deliveryMode === 'auto' && (
              <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Fez Delivery API Key (Bearer Token)</label>
                  <input type="text" value={settings.fezApiKey || ''} onChange={e => handleChange('fezApiKey', e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:border-amber-500 outline-none" placeholder="Paste your Fez Key here" />
                </div>
                <div className="p-4 bg-amber-900/10 border border-amber-900/30 rounded-xl">
                  <p className="text-xs text-amber-500/80 leading-relaxed">
                    Auto-mode pulls real-time motorbike rates from Fez Delivery. Ensure both your store address (above) and the customer address have GPS coordinates locked for accurate routing.
                  </p>
                </div>
              </div>
            )}
            
            {/* ... other delivery modes (flat/zoned) ... */}
          </div>
        </form>
      </div>
    </div>
  )
}