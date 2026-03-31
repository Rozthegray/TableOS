'use client'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { FloorTable } from '@/components/FloorMap'

const FloorMap = dynamic(() => import('@/components/FloorMap'), { ssr: false })

const TIME_SLOTS = [
  '11:00','11:30','12:00','12:30','13:00','13:30',
  '14:00','14:30','17:00','17:30','18:00','18:30',
  '19:00','19:30','20:00','20:30','21:00',
]

type Step = 'datetime' | 'table' | 'details' | 'success'

export default function ReservationPage() {
  const [step, setStep] = useState<Step>('datetime')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [date, setDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [guests, setGuests] = useState('2')
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const handleTableSelect = useCallback((table: FloorTable) => {
    setSelectedTable((prev) => prev?.id === table.id ? null : table)
  }, [])

  const handleSubmit = async () => {
    if (!form.name || !form.phone) return setError('Please fill your name and phone')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable!.id, skipAutoAssign: true,
          customer: { name: form.name, phone: form.phone, email: form.email || undefined },
          date, timeSlot, guests: parseInt(guests), notes: form.notes || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) setStep('success')
      else setError(data.error || 'Booking failed. Try another time.')
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }

  const STEPS: Step[] = ['datetime', 'table', 'details']

  if (step === 'success') return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="font-serif text-3xl font-bold text-amber-400 mb-3">You're booked!</h1>
        <div className="bg-stone-900 border border-stone-700 rounded-2xl p-5 mb-6 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-stone-500">Table</span><span className="text-amber-400 font-semibold">{selectedTable?.name}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Date</span><span className="text-stone-200">{new Date(date).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Time</span><span className="text-stone-200">{timeSlot}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Guests</span><span className="text-stone-200">{guests} people</span></div>
        </div>
        <p className="text-stone-500 text-sm mb-8">📱 SMS confirmation sent to {form.phone}</p>
        <div className="flex gap-3 justify-center">
          <a href="/menu" className="px-6 py-2.5 bg-amber-500 text-stone-950 font-bold rounded-xl hover:bg-amber-400 transition-colors">Pre-order Food</a>
          <a href="/" className="px-6 py-2.5 bg-stone-800 text-stone-200 rounded-xl hover:bg-stone-700 transition-colors">Home</a>
        </div>
      </div>
    </div>
  )

  return (
    // 🛡️ FIX: Added pt-24 here!
    <div className="min-h-screen bg-stone-950 text-stone-100 pt-24">
      <div className="border-b border-stone-800 px-6 py-4 flex items-center gap-4">
        <a href="/" className="text-stone-500 hover:text-stone-300 text-sm">← Back</a>
        <h1 className="font-serif text-2xl font-bold text-amber-400">Reserve a Table</h1>
      </div>

      {/* Step bar */}
      <div className="border-b border-stone-800 px-6 py-3">
        <div className="flex items-center gap-3 max-w-3xl">
          {[{k:'datetime',l:'Date & Time'},{k:'table',l:'Pick Table'},{k:'details',l:'Details'}].map((s,i)=>{
            const idx=STEPS.indexOf(step), thisIdx=STEPS.indexOf(s.k as Step)
            const done=idx>thisIdx, active=idx===thisIdx
            return (
              <div key={s.k} className="flex items-center gap-2">
                {i>0 && <div className={`w-10 h-px ${done||active?'bg-amber-500':'bg-stone-700'}`}/>}
                <div className={`flex items-center gap-2 text-sm ${active?'text-amber-400':done?'text-green-400':'text-stone-600'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active?'bg-amber-500 text-stone-950':done?'bg-green-600 text-white':'bg-stone-800 text-stone-600'}`}>
                    {done?'✓':i+1}
                  </div>
                  <span className="hidden sm:block font-medium">{s.l}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* STEP 1 */}
        {step === 'datetime' && (
          <div className="max-w-lg">
            <h2 className="font-serif text-2xl mb-6">When would you like to visit?</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Date *</label>
                <input type="date" min={minDate} value={date} onChange={(e)=>setDate(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-500 [color-scheme:dark]"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Time *</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {TIME_SLOTS.map(slot=>(
                    <button key={slot} onClick={()=>setTimeSlot(slot)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${timeSlot===slot?'bg-amber-500 text-stone-950':'bg-stone-900 border border-stone-700 text-stone-400 hover:border-amber-500/40'}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Party Size *</label>
                <div className="flex gap-2">
                  {['1','2','3','4','5','6','7','8+'].map(n=>(
                    <button key={n} onClick={()=>setGuests(n==='8+'?'8':n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${guests===(n==='8+'?'8':n)?'bg-amber-500 text-stone-950':'bg-stone-900 border border-stone-700 text-stone-400 hover:border-amber-500/40'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
            <button onClick={()=>{if(!date||!timeSlot)return setError('Pick a date and time');setError('');setStep('table')}}
              disabled={!date||!timeSlot}
              className="mt-8 w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold rounded-xl transition-colors text-lg">
              Next: Choose Your Table →
            </button>
          </div>
        )}

        {/* STEP 2 — VISUAL MAP */}
        {step === 'table' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-serif text-2xl">Choose your table</h2>
              <div className="flex items-center gap-3 text-sm text-stone-400 bg-stone-900 border border-stone-700 px-4 py-2 rounded-xl">
                <span>📅 {new Date(date).toLocaleDateString('en-NG',{day:'numeric',month:'short'})}</span>
                <span>·</span>
                <span>🕐 {timeSlot}</span>
                <span>·</span>
                <span>👥 {guests}</span>
              </div>
            </div>
            <p className="text-stone-500 text-sm mb-5">
              Click a <span className="text-green-400 font-semibold">green table</span> to select it. Hover to see capacity &amp; features.
            </p>

            <FloorMap section="restaurant" selectedId={selectedTable?.id??null} onSelect={handleTableSelect} date={date} timeSlot={timeSlot}/>

            {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setStep('datetime')} className="px-6 py-3 bg-stone-800 text-stone-300 rounded-xl hover:bg-stone-700">← Back</button>
              <button onClick={()=>{if(!selectedTable)return setError('Please select a table');setError('');setStep('details')}}
                disabled={!selectedTable}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold rounded-xl transition-colors">
                Continue with {selectedTable?.name||'…'} →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 'details' && (
          <div className="max-w-lg">
            <h2 className="font-serif text-2xl mb-2">Your details</h2>
            <div className="bg-stone-900 border border-amber-500/20 rounded-xl p-4 mb-6 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-stone-500">Table</span><span className="text-amber-400 font-semibold">{selectedTable?.name} · {selectedTable?.capacity} seats</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Date & Time</span><span className="text-stone-200">{new Date(date).toLocaleDateString('en-NG',{weekday:'short',day:'numeric',month:'short'})} at {timeSlot}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Guests</span><span className="text-stone-200">{guests} people</span></div>
            </div>
            <div className="space-y-3">
              <input placeholder="Full Name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"/>
              <input placeholder="Phone Number * (08012345678)" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"/>
              <input placeholder="Email (optional)" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"/>
              <textarea placeholder="Special requests (dietary needs, occasion…)" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 resize-none"/>
            </div>
            {error && <div className="mt-3 bg-red-900/30 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">{error}</div>}
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setStep('table')} className="px-6 py-3 bg-stone-800 text-stone-300 rounded-xl hover:bg-stone-700">← Back</button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-bold rounded-xl transition-colors">
                {loading?'Confirming…':'Confirm Reservation 🎉'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}