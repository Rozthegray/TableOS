'use client'
import { useState, useEffect } from 'react'
import { Trash2, Plus } from 'lucide-react'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [settings, setSettings] = useState({
    bankName: '', bankAccountName: '', bankAccountNumber: '',
    paystackPublicKey: '',
    deliveryMode: 'flat', deliveryFee: 1500, deliveryZones: [] as {name: string, fee: number}[],
    kwikEmail: '', kwikPassword: '', freeDeliveryAbove: 10000, 
    restaurantName: '', 
    restaurantPhone: '', 
    restaurantAddress: '',
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

  const handleZoneChange = (index: number, field: 'name' | 'fee', value: string | number) => {
    const newZones = [...(settings.deliveryZones || [])]
    newZones[index] = { ...newZones[index], [field]: value }
    handleChange('deliveryZones', newZones)
  }

  const addZone = () => handleChange('deliveryZones', [...(settings.deliveryZones || []), { name: '', fee: 0 }])
  const removeZone = (index: number) => handleChange('deliveryZones', (settings.deliveryZones || []).filter((_, i) => i !== index))

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
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  if (loading) return <div className="p-6 text-stone-400">Loading settings...</div>

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="font-serif text-3xl font-bold text-amber-400">Store Settings</h1>
            <p className="text-stone-500 text-sm mt-1">Manage payments, advanced delivery, and store info.</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold rounded-xl transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {message.text && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
            {message.text}
          </div>
        )}

        <form className="space-y-8" onSubmit={handleSave}>

          {/* Payment Info */}
          <div className="bg-stone-900 rounded-2xl p-6 border border-stone-800">
            <h2 className="text-xl font-bold mb-4 border-b border-stone-800 pb-2">💳 Payment Methods</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Paystack Public Key</label>
                <input value={settings.paystackPublicKey || ''} onChange={e => handleChange('paystackPublicKey', e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:border-amber-500" placeholder="pk_test_..." />
              </div>
              <div className="md:col-span-2 mt-4"><h3 className="text-sm font-semibold text-stone-300">Direct Bank Transfer Details</h3></div>
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Bank Name</label>
                <input value={settings.bankName || ''} onChange={e => handleChange('bankName', e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Account Number</label>
                <input value={settings.bankAccountNumber || ''} onChange={e => handleChange('bankAccountNumber', e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:border-amber-500" />
              </div>
            </div>
          </div>

          <div className="bg-stone-900 rounded-2xl p-6 border border-stone-800">
            <h2 className="text-xl font-bold mb-4 border-b border-stone-800 pb-2">🏪 Store Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Restaurant Name</label>
                <input value={settings.restaurantName || ''} onChange={e => handleChange('restaurantName', e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:border-amber-500" placeholder="TableOS Cafe" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Phone Number</label>
                <input value={settings.restaurantPhone || ''} onChange={e => handleChange('restaurantPhone', e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:border-amber-500" placeholder="080..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Pickup Address (Crucial for Kwik Delivery)</label>
                <input value={settings.restaurantAddress || ''} onChange={e => handleChange('restaurantAddress', e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:border-amber-500" placeholder="e.g. 10 Admiralty Way, Lekki Phase 1, Lagos" />
                <p className="text-xs text-stone-500 mt-2">This is the exact address Kwik dispatch riders will use to pick up the food.</p>
              </div>
            </div>
          </div>

          {/* Payment Info (Leave your existing code here) */}
          <div className="bg-stone-900 rounded-2xl p-6 border border-stone-800">

          {/* Advanced Delivery Logic */}
          <div className="bg-stone-900 rounded-2xl p-6 border border-stone-800">
            <h2 className="text-xl font-bold mb-4 border-b border-stone-800 pb-2"> Delivery Setup</h2>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Pricing Mode</label>
              <div className="flex gap-4">
                {['flat', 'zoned', 'auto'].map(mode => (
                  <label key={mode} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" checked={settings.deliveryMode === mode} onChange={() => handleChange('deliveryMode', mode)} className="accent-amber-500 w-4 h-4" />
                    <span className="capitalize">{mode} Mode</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Flat Rate UI */}
            {settings.deliveryMode === 'flat' && (
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Flat Delivery Fee (₦)</label>
                <input type="number" value={settings.deliveryFee || 0} onChange={e => handleChange('deliveryFee', Number(e.target.value))} className="w-full md:w-1/2 bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:border-amber-500" />
              </div>
            )}

            {/* Kwik UI (Replaced Auto/Aggregator) */}
            {settings.deliveryMode === 'auto' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Kwik Corporate Email</label>
                  <input type="email" value={settings.kwikEmail || ''} onChange={e => handleChange('kwikEmail', e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:border-amber-500" placeholder="admin@restaurant.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Kwik Password</label>
                  <input type="password" value={settings.kwikPassword || ''} onChange={e => handleChange('kwikPassword', e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:border-amber-500" placeholder="••••••••" />
                </div>
                <p className="text-xs text-stone-500 mt-2 md:col-span-2">Rates will be calculated dynamically at checkout using the Kwik Delivery Engine.</p>
              </div>
            )}

            {/* Zoned UI */}
            {settings.deliveryMode === 'zoned' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider">Delivery Zones & Fees</label>
                {(settings.deliveryZones || []).map((zone, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input value={zone.name} onChange={e => handleZoneChange(idx, 'name', e.target.value)} placeholder="e.g. Lekki Phase 1" className="flex-1 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 focus:border-amber-500" />
                    <input type="number" value={zone.fee} onChange={e => handleZoneChange(idx, 'fee', Number(e.target.value))} placeholder="Fee" className="w-32 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 focus:border-amber-500" />
                    <button type="button" onClick={() => removeZone(idx)} className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg"><Trash2 size={18}/></button>
                  </div>
                ))}
                <button type="button" onClick={addZone} className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 mt-2">
                  <Plus size={16}/> Add New Zone
                </button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-stone-800">
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Free Delivery Threshold (₦)</label>
              <input type="number" value={settings.freeDeliveryAbove || 0} onChange={e => handleChange('freeDeliveryAbove', Number(e.target.value))} className="w-full md:w-1/2 bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:border-amber-500" />
              <p className="text-xs text-stone-500 mt-1">Set to 0 to disable free delivery promotions.</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
