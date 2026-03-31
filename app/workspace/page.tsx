'use client'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { FloorTable } from '@/components/FloorMap'

const FloorMap = dynamic(() => import('@/components/FloorMap'), { ssr: false })

const PLANS = [
  { id: 'daily',   name: 'Day Pass',    price: 2000,  icon: '☀️', unit: 'day',
    perks: ['Full-day access (8am–8pm)', 'High-speed WiFi', 'Power outlets', 'Free coffee refill'] },
  { id: 'monthly', name: 'Monthly',     price: 25000, icon: '📅', unit: 'month', popular: true,
    perks: ['30 days unlimited access', 'Reserved desk', '50 pages printing', 'Priority seating', '10% food discount'] },
]

function formatNaira(n: number) {
  return new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(n)
}

type Step = 'plan' | 'seat' | 'details' | 'success'

export default function WorkspacePage() {
  const [step, setStep] = useState<Step>('plan')
  const [plan, setPlan] = useState<'daily'|'monthly'>('daily')
  const [date, setDate] = useState('')
  const [selectedSeat, setSelectedSeat] = useState<FloorTable|null>(null)
  const [form, setForm] = useState({ name:'', phone:'', email:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]
  const currentPlan = PLANS.find(p=>p.id===plan)!

  const handleSeatSelect = useCallback((seat: FloorTable) => {
    setSelectedSeat(prev => prev?.id === seat.id ? null : seat)
  }, [])

  const handleBook = async () => {
    if(!form.name||!form.phone) return setError('Fill your name and phone')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/workspace', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          plan, date,
          seatId: selectedSeat!.id,
          user:{ name:form.name, phone:form.phone, email:form.email||undefined },
        }),
      })
      const data = await res.json()
      if(data.success) setStep('success')
      else setError(data.error||'Booking failed. Try another date.')
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }

  if(step==='success') return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">💻</div>
        <h1 className="font-serif text-3xl font-bold text-amber-400 mb-2">Workspace Booked!</h1>
        <div className="bg-stone-900 border border-stone-700 rounded-2xl p-5 mb-6 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-stone-500">Seat</span><span className="text-amber-400 font-semibold">{selectedSeat?.name}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Plan</span><span className="text-stone-200 capitalize">{plan}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Date</span><span className="text-stone-200">{new Date(date).toLocaleDateString('en-NG',{weekday:'short',day:'numeric',month:'long'})}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Amount</span><span className="text-amber-400 font-bold">{formatNaira(currentPlan.price)}</span></div>
        </div>
        <p className="text-stone-500 text-sm mb-6">📱 Confirmation SMS sent to {form.phone}<br/>WiFi password given on arrival</p>
        <div className="flex gap-3 justify-center">
          <a href="/menu" className="px-6 py-2.5 bg-amber-500 text-stone-950 font-bold rounded-xl hover:bg-amber-400">Pre-order Food</a>
          <a href="/" className="px-6 py-2.5 bg-stone-800 text-stone-200 rounded-xl hover:bg-stone-700">Home</a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Hero */}
      <div className="relative py-16 px-6 text-center" style={{background:'radial-gradient(ellipse 60% 60% at 50% 0%,#1c1005,#0a0a0a)'}}>
        <span className="inline-block bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wider uppercase px-4 py-1.5 rounded-full mb-4">
          🔥 Remote Worker's Haven
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-3">Work from <span className="text-amber-400">TableOS</span></h1>
        <p className="text-stone-400 max-w-lg mx-auto">Fast WiFi · Great coffee · Choose your own seat on our live floor map</p>
      </div>

      {/* Amenities */}
      <div className="border-y border-stone-800 bg-stone-900/50 py-3 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-5 text-stone-400 text-sm">
          {['⚡ 50Mbps WiFi','🔌 Outlets at every desk','☕ Free coffee refill','🖨️ Printing','❄️ AC','🔒 Lockers'].map(a=>(
            <span key={a}>{a}</span>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* STEP 1 — PLAN SELECTION */}
        {step==='plan' && (
          <>
            <h2 className="font-serif text-2xl text-center mb-2">Choose your plan</h2>
            <p className="text-center text-stone-500 text-sm mb-8">No commitment. Cancel anytime.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
              {PLANS.map(p=>(
                <div key={p.id} onClick={()=>setPlan(p.id as 'daily'|'monthly')}
                  className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all ${plan===p.id?'border-amber-500 bg-amber-500/5':'border-stone-700 bg-stone-900 hover:border-stone-500'}`}>
                  {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-stone-950 text-xs font-bold px-3 py-1 rounded-full">POPULAR</span>}
                  <div className="text-4xl mb-3">{p.icon}</div>
                  <h3 className="font-serif text-xl font-bold mb-1">{p.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-amber-400">{formatNaira(p.price)}</span>
                    <span className="text-stone-500 text-sm">/{p.unit}</span>
                  </div>
                  <ul className="space-y-2">
                    {p.perks.map(pk=>(
                      <li key={pk} className="flex items-start gap-2 text-stone-400 text-sm">
                        <span className="text-green-400">✓</span>{pk}
                      </li>
                    ))}
                  </ul>
                  {plan===p.id && <div className="absolute top-4 right-4 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-stone-950 text-xs font-bold">✓</div>}
                </div>
              ))}
            </div>

            {/* Date selection */}
            <div className="max-w-2xl mx-auto">
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Start Date *</label>
              <input type="date" min={minDate} value={date} onChange={e=>setDate(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-500 [color-scheme:dark] mb-6"/>

              <button onClick={()=>{if(!date)return setError('Please select a date');setError('');setStep('seat')}}
                disabled={!date}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold rounded-xl text-lg transition-colors">
                Next: Choose Your Desk →
              </button>
              {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
            </div>
          </>
        )}

        {/* STEP 2 — VISUAL SEAT MAP */}
        {step==='seat' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-serif text-2xl">Pick your desk</h2>
                <p className="text-stone-500 text-sm mt-1">Click a green desk to claim your spot</p>
              </div>
              <div className="flex items-center gap-3 bg-stone-900 border border-stone-700 px-4 py-2 rounded-xl text-sm text-stone-400">
                <span className="capitalize">{plan} plan</span>
                <span>·</span>
                <span className="text-amber-400 font-semibold">{formatNaira(currentPlan.price)}</span>
                <span>·</span>
                <span>📅 {new Date(date).toLocaleDateString('en-NG',{day:'numeric',month:'short'})}</span>
              </div>
            </div>

            {/* Workspace-specific feature legend */}
            <div className="flex gap-4 mb-4 flex-wrap text-xs text-stone-500">
              <span>🪟 Window view</span>
              <span>🔕 Quiet zone</span>
              <span>↕ Standing desk</span>
              <span>👥 Meeting pod</span>
              <span>⚡ Power outlet</span>
            </div>

            <FloorMap section="workspace" selectedId={selectedSeat?.id??null} onSelect={handleSeatSelect} date={date}/>

            {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setStep('plan')} className="px-6 py-3 bg-stone-800 text-stone-300 rounded-xl hover:bg-stone-700">← Back</button>
              <button onClick={()=>{if(!selectedSeat)return setError('Please select a desk');setError('');setStep('details')}}
                disabled={!selectedSeat}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold rounded-xl transition-colors">
                Book {selectedSeat?.name||'…'} →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — DETAILS */}
        {step==='details' && (
          <div className="max-w-md mx-auto">
            <h2 className="font-serif text-2xl mb-2">Your details</h2>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-stone-500">Desk</span><span className="text-amber-400 font-semibold">{selectedSeat?.name}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Plan</span><span className="text-stone-200 capitalize">{plan}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Date</span><span className="text-stone-200">{new Date(date).toLocaleDateString('en-NG',{weekday:'short',day:'numeric',month:'short'})}</span></div>
              <div className="flex justify-between font-bold"><span className="text-stone-400">Total</span><span className="text-amber-400">{formatNaira(currentPlan.price)}</span></div>
            </div>

            <div className="space-y-3">
              <input placeholder="Full Name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"/>
              <input placeholder="Phone Number *" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"/>
              <input placeholder="Email (optional)" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"/>
            </div>

            {error && <div className="mt-3 bg-red-900/30 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">{error}</div>}
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setStep('seat')} className="px-6 py-3 bg-stone-800 text-stone-300 rounded-xl hover:bg-stone-700">← Back</button>
              <button onClick={handleBook} disabled={loading}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-bold rounded-xl transition-colors">
                {loading?'Booking…':`Confirm · ${formatNaira(currentPlan.price)}`}
              </button>
            </div>
            <p className="text-center text-stone-600 text-xs mt-4">Pay on arrival · SMS confirmation sent immediately</p>
          </div>
        )}
      </div>
    </div>
  )
}
