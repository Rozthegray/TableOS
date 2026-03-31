'use client'
import { useState, useEffect, useCallback } from 'react'
import { IOrder } from '../../../lib/types'

function formatNaira(n: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-stone-700 text-stone-300',
  confirmed: 'bg-blue-900/50 text-blue-300',
  preparing: 'bg-amber-900/50 text-amber-300',
  ready:     'bg-green-900/50 text-green-300',
  delivered: 'bg-green-900/30 text-green-500',
  cancelled: 'bg-red-900/50 text-red-300',
}

const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed', confirmed: 'preparing', preparing: 'ready', ready: 'delivered',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [orderType, setOrderType] = useState('')
  const [date, setDate] = useState('')
  const [selected, setSelected] = useState<IOrder | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (orderType) params.set('orderType', orderType)
    if (date) params.set('date', date)
    params.set('limit', '50')

    const res = await fetch(`/api/orders?${params}`)
    const data = await res.json()
    if (data.success) setOrders(data.data)
    setLoading(false)
  }, [status, orderType, date])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const updateStatus = async (orderId: string, newStatus: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchOrders()
    if (selected?._id === orderId) {
      setSelected((prev) => prev ? { ...prev, status: newStatus as IOrder['status'] } : null)
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-stone-800 p-4 space-y-6">
        <div>
          <a href="/admin" className="text-stone-500 hover:text-stone-300 text-sm">← Dashboard</a>
          <h2 className="font-serif text-xl font-bold text-amber-400 mt-2">Orders</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 text-sm focus:outline-none">
              <option value="">All Statuses</option>
              {['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Type</label>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 text-sm focus:outline-none">
              <option value="">All Types</option>
              <option value="delivery">🚚 Delivery</option>
              <option value="pickup">🏃 Pickup</option>
              <option value="dine-in">🍽️ Dine-in</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 text-sm focus:outline-none [color-scheme:dark]" />
          </div>

          <button onClick={() => { setStatus(''); setOrderType(''); setDate('') }}
            className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 text-sm rounded-lg transition-colors">
            Clear Filters
          </button>
        </div>

        {/* Quick status filters */}
        <div>
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Quick Filter</label>
          <div className="space-y-1">
            {[
              { label: '⏳ Pending', value: 'pending' },
              { label: '🍳 Preparing', value: 'preparing' },
              { label: '🔔 Ready', value: 'ready' },
            ].map((q) => (
              <button key={q.value} onClick={() => setStatus(q.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  status === q.value ? 'bg-amber-500/20 text-amber-400' : 'text-stone-400 hover:bg-stone-800'
                }`}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <span className="text-stone-400 text-sm">{orders.length} orders</span>
          <button onClick={fetchOrders} className="text-xs text-stone-500 hover:text-stone-300">↻ Refresh</button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-stone-500">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-stone-600">No orders match your filters</div>
        ) : (
          <div className="divide-y divide-stone-800">
            {orders.map((order) => (
              <div key={order._id}
                onClick={() => setSelected(selected?._id === order._id ? null : order)}
                className={`px-5 py-4 cursor-pointer transition-colors ${
                  selected?._id === order._id ? 'bg-stone-800' : 'hover:bg-stone-900'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-amber-400 text-xs">{order.orderNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-stone-500 capitalize">{order.orderType}</span>
                  </div>
                  <span className="font-bold text-stone-200">{formatNaira(order.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-stone-300 text-sm font-medium">{order.customer.name}</span>
                    <span className="text-stone-500 text-xs ml-2">{order.customer.phone}</span>
                  </div>
                  <span className="text-stone-600 text-xs">{new Date(order.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Expanded detail */}
                {selected?._id === order._id && (
                  <div className="mt-4 pt-4 border-t border-stone-700 space-y-3">
                    <div className="space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-stone-300">{item.name} <span className="text-stone-500">×{item.quantity}</span></span>
                          <span className="text-stone-400">{formatNaira(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    {order.customer.address && (
                      <p className="text-xs text-stone-500">📍 {order.customer.address}</p>
                    )}
                    {order.notes && (
                      <p className="text-xs text-stone-500 italic">"{order.notes}"</p>
                    )}
                    <div className="flex gap-2 flex-wrap pt-1">
                      {NEXT_STATUS[order.status] && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(order._id, NEXT_STATUS[order.status]) }}
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg transition-colors capitalize">
                          Mark as {NEXT_STATUS[order.status]} →
                        </button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(order._id, 'cancelled') }}
                          className="px-4 py-1.5 bg-red-900/50 hover:bg-red-800/60 text-red-300 text-xs font-medium rounded-lg transition-colors">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}