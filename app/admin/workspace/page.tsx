'use client'
import { useState, useEffect, useCallback } from 'react'

interface WorkspaceBooking {
  _id: string
  user: { name: string; phone: string; email?: string }
  seatId: { _id: string; name: string } | string
  plan: 'daily' | 'monthly'
  date: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  createdAt: string
}

// 🛡️ Helper to make database IDs human-readable
const formatSeatName = (rawName: string) => {
  if (!rawName) return 'Unknown'
  return rawName
    .replace('WS-POD-', 'Pod ')
    .replace('WS-', 'Desk ')
}

export default function AdminWorkspacePage() {
  const [bookings, setBookings] = useState<WorkspaceBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (dateFilter) params.set('date', dateFilter)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/workspace?${params}`)
      
      if (!res.ok) {
        throw new Error(`Server crashed with status: ${res.status}`)
      }
      
      const data = await res.json()
      if (data.success) {
        setBookings(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch data')
      }
    } catch (err: unknown) {
      console.error('Fetch error:', err)
      setError('Could not load bookings. Check your backend API.')
      setBookings([]) 
    } finally {
      setLoading(false)
    }
  }, [dateFilter, statusFilter])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

const updateStatus = async (id: string, newStatus: string) => {
    // ⚡ Optimistic UI Update: Change the screen instantly before the server responds!
    setBookings((prevBookings) => 
      prevBookings.map((b) => 
        b._id === id ? { ...b, status: newStatus as WorkspaceBooking['status'] } : b
      )
    )

    try {
      const res = await fetch(`/api/workspace/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      const data = await res.json()
      
      // If the server rejected it, throw an error to trigger the catch block
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server rejected the update')
      }
      
    } catch (error: any) {
      console.error('Failed to update status:', error)
      alert(`Update failed: ${error.message}`)
      // Revert the UI back to normal if the database failed
      fetchBookings() 
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header & Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-amber-400">Workspace Bookings</h1>
            <p className="text-stone-500 text-sm mt-1">Manage remote workers and desk assignments</p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-100 focus:border-amber-500 [color-scheme:dark]"
            />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-100 focus:border-amber-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active (Seated)</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Table / List */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-stone-950/50 text-stone-400 border-b border-stone-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Plan</th>
                  <th className="px-6 py-4 font-semibold">Seat</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-stone-500">Loading bookings...</td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-stone-500">No workspace bookings found.</td>
                  </tr>
                ) : (
                  bookings.map((b) => {
                    // Extract the raw string name securely
                    const rawSeatName = typeof b.seatId === 'object' ? b.seatId.name : b.seatId

                    return (
                      <tr key={b._id} className="hover:bg-stone-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-stone-200">{b.user.name}</p>
                          <p className="text-stone-500 text-xs">{b.user.phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                            b.plan === 'monthly' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-stone-800 text-stone-300'
                          }`}>
                            {b.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-stone-300">
                          {/* 🛡️ Formatted Seat Name Rendered Here */}
                          {formatSeatName(rawSeatName)}
                        </td>
                        <td className="px-6 py-4 text-stone-400">
                          {new Date(b.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            b.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            b.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            b.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-stone-800 text-stone-400' // Pending
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {b.status === 'pending' && (
                              <button onClick={() => updateStatus(b._id, 'active')} className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold transition-colors">
                                Check-In
                              </button>
                            )}
                            {b.status === 'active' && (
                              <button onClick={() => updateStatus(b._id, 'completed')} className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs transition-colors">
                                End Session
                              </button>
                            )}
                            {(b.status === 'pending' || b.status === 'active') && (
                              <button onClick={() => updateStatus(b._id, 'cancelled')} className="px-3 py-1.5 text-red-400 hover:bg-red-950/50 rounded-lg text-xs transition-colors">
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}