'use client'
import { useState, useEffect, useRef } from 'react' 
import { useCartStore } from '../../store/cart'
import { OrderType } from '../../lib/types'
import { useRouter } from 'next/navigation'
import { usePaystackPayment } from 'react-paystack'

const ORDER_TYPES = [
  { value: 'delivery', label: 'Delivery', icon: '🚚', desc: 'Delivered to your address' },
  { value: 'pickup', label: 'Pickup', icon: '🏃', desc: 'Collect at the counter' },
  { value: 'dine-in', label: 'Dine-In', icon: '🍽️', desc: 'Sit and enjoy with us' },
]

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)
}

export default function CartContent() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore()
  const router = useRouter()

  const [settings, setSettings] = useState<any>(null)
  const [orderType, setOrderType] = useState<OrderType>('delivery')
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart')
  const [submitting, setSubmitting] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  // 🚚 Delivery & Map States
  const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState<number | null>(null)
  const [calculatingFee, setCalculatingFee] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [customerCoordinates, setCustomerCoordinates] = useState({ lat: '', lng: '' })

  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // 🛡️ Added houseDetails to state
  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', houseDetails: '', notes: '',
    paymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'paystack',
  })

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSettings(data.data)
      })
      .catch((err) => console.error("Failed to load settings", err))
  }, [])

  const handleField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  // 🌍 ENTERPRISE MAP: LocationIQ Integration
  const handleAddressSearch = async (query: string) => {
    handleField('address', query)
    setDynamicDeliveryFee(null) 
    setCustomerCoordinates({ lat: '', lng: '' })

    if (query.length < 5) {
      setSearchResults([])
      setIsSearchingAddress(false)
      return
    }

    setIsSearchingAddress(true)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    debounceTimer.current = setTimeout(async () => {
      try {
        const LOCATIONIQ_TOKEN = "pk.e6b3232142dec838e8c4bd962ca5610f" 
        
        const res = await fetch(`https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_TOKEN}&format=json&countrycodes=ng&q=${encodeURIComponent(query)}`)
        const data = await res.json()
        
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

  const selectAddress = (result: any) => {
    handleField('address', result.display_name)
    setCustomerCoordinates({ lat: result.lat, lng: result.lon }) 
    setSearchResults([]) 
  }

  // Combine Map Address and House Specifics
  const fullDeliveryAddress = form.houseDetails ? `${form.houseDetails}, ${form.address}` : form.address

  // 🏍️ Fetch Delivery Quote
  const calculateDeliveryFee = async () => {
    if (!customerCoordinates.lat) return alert('Please select a valid region/road from the dropdown list.')
    setCalculatingFee(true)
    
    try {
      const res = await fetch('/api/deliveries/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerAddress: fullDeliveryAddress,
          customerLat: customerCoordinates.lat,
          customerLng: customerCoordinates.lng
        })
      })
      const data = await res.json()
      
      if (data.success) {
        setDynamicDeliveryFee(data.deliveryFee)
      } else {
        alert(data.error || 'Could not calculate delivery fee for this route.')
      }
    } catch {
      alert('Network error calculating delivery fee.')
    } finally {
      setCalculatingFee(false)
    }
  }

  const cartTotal = total()
  let deliveryFee = 0
  
  if (orderType === 'delivery' && settings) {
    if (settings.deliveryMode === 'auto') {
      deliveryFee = dynamicDeliveryFee || 0
    } else {
      deliveryFee = settings.deliveryFee || 0
    }

    if (settings.freeDeliveryAbove > 0 && cartTotal >= settings.freeDeliveryAbove) {
      deliveryFee = 0
    }
  }
  
  const grandTotal = cartTotal + deliveryFee

  const paystackConfig = {
    reference: `ORD-${new Date().getTime()}`,
    email: form.email || 'customer@tableos.com',
    amount: grandTotal * 100, 
    publicKey: settings?.paystackPublicKey || '',
  }
  const initializePayment = usePaystackPayment(paystackConfig)

  const placeOrderInDB = async (paymentReference?: string) => {
    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.product._id,
          name: i.product.name,
          quantity: i.quantity,
          price: i.product.price,
        })),
        totalAmount: grandTotal, 
        orderType,
        customer: {
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          address: fullDeliveryAddress || undefined,
          lat: customerCoordinates.lat || undefined,
          lng: customerCoordinates.lng || undefined,
        },
        paymentMethod: form.paymentMethod,
        paymentReference, 
        notes: form.notes || undefined,
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (data.success) {
        setOrderNumber(data.data.orderNumber)
        clearCart()
        setStep('success')
      } else {
        alert(data.error || 'Failed to place order')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.name || !form.phone) return alert('Please fill your name and phone number')
    
    // 🛡️ Ensure they fill out both the map address AND the exact house details
    if (orderType === 'delivery') {
      if (!form.address) return alert('Please search and select your Area/Road from the map.')
      if (!form.houseDetails) return alert('Please enter your exact House/Apartment Number.')
    }
    
    if (!items.length) return alert('Your cart is empty')
    
    if (orderType === 'delivery' && settings?.deliveryMode === 'auto' && dynamicDeliveryFee === null) {
      return alert('Please calculate the delivery fee for your address first.')
    }
    
    if (form.paymentMethod === 'paystack' && !settings?.paystackPublicKey) {
      return alert('Online payments are currently unavailable. Please choose Cash or Bank Transfer.')
    }

    setSubmitting(true)

    if (form.paymentMethod === 'paystack') {
      initializePayment({
        onSuccess: (reference: any) => {
          placeOrderInDB(reference.reference) 
        },
        onClose: () => {
          alert('Payment cancelled.')
          setSubmitting(false) 
        }
      })
    } else {
      placeOrderInDB()
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="font-serif text-3xl font-bold text-amber-400 mb-3">Order Placed!</h1>
          <p className="text-stone-400 mb-2">Your order number is</p>
          <div className="font-mono text-2xl text-stone-100 bg-stone-900 rounded-xl px-6 py-3 mb-6 border border-stone-700">
            {orderNumber}
          </div>
          <p className="text-stone-500 text-sm mb-8">We'll send you SMS updates as your order progresses.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push('/menu')} className="px-6 py-2.5 bg-amber-500 text-stone-950 font-semibold rounded-xl hover:bg-amber-400 transition-colors">
              Order More
            </button>
            <button onClick={() => router.push(`/track/${orderNumber}`)} className="px-6 py-2.5 bg-stone-800 text-stone-200 rounded-xl hover:bg-stone-700 transition-colors">
              Track Order
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="font-serif text-2xl text-stone-300 mb-2">Your cart is empty</h2>
          <p className="text-stone-500 mb-6">Add some delicious items first</p>
          <button onClick={() => router.push('/menu')} className="px-6 py-2.5 bg-amber-500 text-stone-950 font-semibold rounded-xl hover:bg-amber-400">
            Browse Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/menu')} className="text-stone-500 hover:text-stone-300">←</button>
          <h1 className="font-serif text-2xl font-bold text-amber-400">
            {step === 'cart' ? 'Your Cart' : 'Checkout'}
          </h1>
        </div>

        {step === 'cart' && (
          <>
            <div className="space-y-3 mb-8">
              {items.map((item) => (
                <div key={item.product._id} className="flex items-center gap-4 bg-stone-900 rounded-xl p-4 border border-stone-800">
                  <div className="flex-1">
                    <p className="font-medium text-stone-100">{item.product.name}</p>
                    <p className="text-amber-400 text-sm font-semibold">{formatNaira(item.product.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)} className="w-7 h-7 bg-stone-700 rounded-lg text-stone-300 hover:bg-stone-600 flex items-center justify-center text-lg leading-none">−</button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)} className="w-7 h-7 bg-stone-700 rounded-lg text-stone-300 hover:bg-stone-600 flex items-center justify-center text-lg leading-none">+</button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatNaira(item.product.price * item.quantity)}</p>
                    <button onClick={() => removeItem(item.product._id)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-stone-900 rounded-xl p-5 border border-stone-800 mb-6">
              <div className="flex justify-between text-stone-400 text-sm mb-2">
                <span>Subtotal</span><span>{formatNaira(cartTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-stone-100 pt-2 border-t border-stone-700">
                <span>Total</span><span className="text-amber-400">{formatNaira(cartTotal)}</span>
              </div>
            </div>

            <button onClick={() => setStep('checkout')} className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition-colors">
              Proceed to Checkout →
            </button>
          </>
        )}

        {step === 'checkout' && (
          <>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">How would you like it?</label>
              <div className="grid grid-cols-3 gap-3">
                {ORDER_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setOrderType(t.value as OrderType)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      orderType === t.value
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-stone-700 bg-stone-900 text-stone-400 hover:border-stone-500'
                    }`}
                  >
                    <div className="text-2xl mb-1">{t.icon}</div>
                    <div className="font-semibold text-sm">{t.label}</div>
                    <div className="text-xs opacity-70 hidden sm:block">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider">Your Details</label>
              <input type="text" placeholder="Full Name *" value={form.name} onChange={(e) => handleField('name', e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500" />
              <input type="tel" placeholder="Phone Number * (e.g. 08012345678)" value={form.phone} onChange={(e) => handleField('phone', e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500" />
              <input type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => handleField('email', e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500" />
              
              {orderType === 'delivery' && (
                <div className="space-y-3 relative p-4 bg-stone-950 border border-stone-800 rounded-2xl mt-4">
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Delivery Location</label>
                  
                  {/* Step 1: Map Search */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="1. Search Region/Road (e.g. Gbagada Deeper Life) *" 
                      value={form.address} 
                      onChange={(e) => handleAddressSearch(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500" 
                    />
                    {isSearchingAddress && <span className="absolute right-4 top-3.5 text-xs text-amber-500">Searching...</span>}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full bg-stone-800 border border-stone-700 rounded-xl mt-1 overflow-hidden shadow-xl">
                      {searchResults.map((result, idx) => (
                        <button 
                          key={idx} 
                          type="button"
                          onClick={() => selectAddress(result)}
                          className="w-full text-left px-4 py-3 text-sm text-stone-300 hover:bg-stone-700 border-b border-stone-700 last:border-0"
                        >
                          {result.display_name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Step 2: Exact House Text Input */}
                  <input 
                    type="text" 
                    placeholder="2. House/Apt Number & Street (e.g. 13 Famous St) *" 
                    value={form.houseDetails} 
                    onChange={(e) => handleField('houseDetails', e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500" 
                  />
                  
                  {settings?.deliveryMode === 'auto' && (
                    <button 
                      type="button"
                      onClick={calculateDeliveryFee} 
                      disabled={calculatingFee || !customerCoordinates.lat} 
                      className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-amber-400 text-sm font-semibold rounded-xl transition-colors mt-2"
                    >
                      {calculatingFee ? 'Calculating...' : dynamicDeliveryFee !== null ? 'Recalculate Delivery Fee' : 'Calculate Delivery Fee'}
                    </button>
                  )}
                </div>
              )}
              
              <textarea placeholder="Special instructions (optional)" value={form.notes} onChange={(e) => handleField('notes', e.target.value)} rows={2}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 resize-none mt-3" />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Payment Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: 'cash', label: '💵 Cash / POS' },
                  { value: 'bank_transfer', label: '🏦 Bank Transfer' },
                  { value: 'paystack', label: '💳 Card (Paystack)' },
                ].map((m) => (
                  <button key={m.value} onClick={() => handleField('paymentMethod', m.value as any)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      form.paymentMethod === m.value
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-stone-700 bg-stone-900 text-stone-400 hover:border-stone-500'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
              
              {form.paymentMethod === 'bank_transfer' && settings && (
                <div className="mt-3 bg-blue-900/10 border border-blue-900/50 p-4 rounded-xl text-blue-200 text-sm">
                  <p className="mb-2 text-blue-300">Please transfer <strong>{formatNaira(grandTotal)}</strong> to:</p>
                  <p>Bank: <strong className="text-white">{settings.bankName}</strong></p>
                  <p>Account: <strong className="text-white">{settings.bankAccountNumber}</strong></p>
                  <p>Name: <strong className="text-white">{settings.bankAccountName}</strong></p>
                </div>
              )}
            </div>

            <div className="bg-stone-900 rounded-xl p-4 border border-stone-800 mb-6 text-sm space-y-1">
              {items.map((i) => (
                <div key={i.product._id} className="flex justify-between text-stone-400">
                  <span>{i.product.name} × {i.quantity}</span>
                  <span>{formatNaira(i.product.price * i.quantity)}</span>
                </div>
              ))}
              
              {orderType === 'delivery' && (
                <div className="flex justify-between text-stone-400 mt-2">
                  <span>Delivery Fee</span>
                  <span>
                    {settings?.deliveryMode === 'auto' && dynamicDeliveryFee === null 
                      ? <span className="text-amber-500">Calculate below</span> 
                      : deliveryFee === 0 ? 'Free' : formatNaira(deliveryFee)}
                  </span>
                </div>
              )}

              <div className="pt-2 mt-2 border-t border-stone-700 flex justify-between font-bold text-amber-400 text-base">
                <span>Total</span><span>{formatNaira(grandTotal)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('cart')} className="px-5 py-3 bg-stone-800 text-stone-300 rounded-xl hover:bg-stone-700 transition-colors">
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={submitting || !settings || (orderType === 'delivery' && settings?.deliveryMode === 'auto' && dynamicDeliveryFee === null)} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-bold rounded-xl transition-colors">
                {submitting ? 'Processing...' : `Pay ${formatNaira(grandTotal)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}