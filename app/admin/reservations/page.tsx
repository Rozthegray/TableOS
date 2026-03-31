'use client'
import { useState, useEffect, useCallback } from 'react'
import { IReservation } from '../../../lib/types'

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-stone-700 text-stone-300',
  confirmed: 'bg-blue-900/50 text-blue-300',
  seated:    'bg-amber-900/50 text-amber-300',
  completed: 'bg-green-900/30 text-green-500',
  cancelled: 'bg-red-900/50 text-red-300',
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<IReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('')

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (date) params.set('date', date)
      if (statusFilter) params.set('status', statusFilter)
      
      const res = await fetch(`/api/reservations?${params}`)
      
      // 🛡️ THE SHIELD: This stops the JSON crash if the server sends an HTML error
      if (!res.ok) {
        throw new Error(`Server crashed with status: ${res.status}`)
      }
      
      const data = await res.json()
      if (data.success) {
        setReservations(data.data)
      } else {
        console.error('Failed to load data:', data.error)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setReservations([]) // Fallback to an empty array so the screen doesn't go white
    } finally {
      setLoading(false)
    }
  }, [date, statusFilter])

  
  useEffect(() => { fetchReservations() }, [fetchReservations])

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchReservations()
  }

  // Group by time slot
  const byTimeSlot: Record<string, IReservation[]> = {}
  reservations.forEach((r) => {
    if (!byTimeSlot[r.timeSlot]) byTimeSlot[r.timeSlot] = []
    byTimeSlot[r.timeSlot].push(r)
  })
  const timeSlots = Object.keys(byTimeSlot).sort()

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <a href="/admin" className="text-stone-500 hover:text-stone-300 text-sm">← Dashboard</a>
            <h1 className="font-serif text-2xl font-bold text-amber-400 mt-1">Reservations</h1>
          </div>
          <a href="/reservations" target="_blank" className="text-xs bg-stone-800 text-stone-400 hover:text-stone-200 px-4 py-2 rounded-lg border border-stone-700 transition-colors">
            + New Reservation (Customer View)
          </a>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="bg-stone-900 border border-stone-700 rounded-lg px-4 py-2 text-stone-200 text-sm focus:outline-none focus:border-amber-500 [color-scheme:dark]" />

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-stone-900 border border-stone-700 rounded-lg px-4 py-2 text-stone-200 text-sm focus:outline-none">
            <option value="">All Statuses</option>
            {['pending', 'confirmed', 'seated', 'completed', 'cancelled'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Date nav */}
          <div className="flex gap-1 ml-auto">
            {[
              { label: 'Today', val: new Date().toISOString().split('T')[0] },
              { label: 'Tomorrow', val: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })() },
            ].map((d) => (
              <button key={d.label} onClick={() => setDate(d.val)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  date === d.val ? 'bg-amber-500 text-stone-950 font-semibold' : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-stone-500">Loading reservations...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🪑</div>
            <p className="text-stone-500">No reservations for this date</p>
          </div>
        ) : (
          <div className="space-y-6">
            {timeSlots.map((slot) => (
              <div key={slot}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-amber-400 font-mono font-bold text-sm">{slot}</span>
                  <div className="flex-1 h-px bg-stone-800" />
                  <span className="text-stone-600 text-xs">{byTimeSlot[slot].length} booking{byTimeSlot[slot].length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {byTimeSlot[slot].map((res) => (
                    <div key={res._id} className="bg-stone-900 rounded-xl border border-stone-800 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-stone-100">{res.customer.name}</p>
                          <p className="text-stone-500 text-xs">{res.customer.phone}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[res.status]}`}>
                          {res.status}
                        </span>
                      </div>

                      <div className="flex gap-4 text-sm text-stone-400 mb-3">
                        <span>👥 {res.guests} guests</span>
                        {res.table && <span>🪑 {(res.table as unknown as { name: string }).name}</span>}
                      </div>

                      {res.notes && (
                        <p className="text-xs text-stone-500 italic mb-3">"{res.notes}"</p>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {res.status === 'pending' && (
                          <>
                            <button onClick={() => updateStatus(res._id, 'confirmed')}
                              className="text-xs px-3 py-1 bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 rounded-lg transition-colors">
                              ✓ Confirm
                            </button>
                            <button onClick={() => updateStatus(res._id, 'cancelled')}
                              className="text-xs px-3 py-1 bg-red-900/30 hover:bg-red-800/40 text-red-300 rounded-lg transition-colors">
                              ✕ Cancel
                            </button>
                          </>
                        )}
                        {res.status === 'confirmed' && (
                          <button onClick={() => updateStatus(res._id, 'seated')}
                            className="text-xs px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors">
                            🪑 Seat Guests
                          </button>
                        )}
                        {res.status === 'seated' && (
                          <button onClick={() => updateStatus(res._id, 'completed')}
                            className="text-xs px-3 py-1 bg-green-900/30 hover:bg-green-800/40 text-green-400 rounded-lg transition-colors">
                            ✓ Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}