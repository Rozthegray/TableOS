'use client'
import { useState, useEffect, useCallback } from 'react'
import { IOrder } from '../../../lib/types'

function formatNaira(n: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)
}

// Added the new delivery statuses here
const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-stone-700 text-stone-300',
  confirmed: 'bg-blue-900/50 text-blue-300',
  preparing: 'bg-amber-900/50 text-amber-300',
  ready:     'bg-green-900/50 text-green-300',
  out_for_delivery: 'bg-purple-900/50 text-purple-300',
  arrived:   'bg-pink-900/50 text-pink-300',
  delivered: 'bg-emerald-900/30 text-emerald-500',
  cancelled: 'bg-red-900/50 text-red-300',
}

const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed', confirmed: 'preparing', preparing: 'ready', ready: 'delivered', out_for_delivery: 'arrived', arrived: 'delivered'
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [orderType, setOrderType] = useState('')
  const [date, setDate] = useState('')
  const [selected, setSelected] = useState<IOrder | null>(null)
  
  // Track ETA inputs per order
  const [etaInputs, setEtaInputs] = useState<Record<string, string>>({})

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

  const updateStatus = async (orderId: string, newStatus: string, estimatedTime?: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, estimatedTime }),
    })
    fetchOrders()
    if (selected?._id === orderId) {
      setSelected((prev) => prev ? { ...prev, status: newStatus as any } : null)
    }
  }

  // Handle the specific Fez Delivery Dispatch Action
  const handleDispatch = async (order: IOrder) => {
    const eta = etaInputs[order._id]
    if (!eta) return alert('Please enter an Estimated Time of Arrival (e.g., "25 mins") before dispatching.')

    try {
      // 1. Ping Fez Delivery API to assign the rider
      await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id, estimatedTime: eta, address: order.customer.address })
      })

      // 2. Change the status to trigger the "Rider has your food" SMS!
      await updateStatus(order._id, 'out_for_delivery', eta)
    } catch (err) {
      alert("Failed to dispatch rider.")
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
              {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'arrived', 'delivered', 'cancelled'].map((s) => (
                <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>
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
              { label: '🛵 On The Way', value: 'out_for_delivery' },
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
                      {order.status.replace(/_/g, ' ')}
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
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap pt-2 items-center">
                      
                      {/* 🚚 Special Flow for Dispatching Delivery Orders */}
                      {order.status === 'ready' && order.orderType === 'delivery' ? (
                        <div className="flex flex-col gap-2 w-full mt-1 bg-stone-900 p-3 rounded-lg border border-stone-700">
                          <label className="text-xs text-stone-400 font-semibold uppercase tracking-wider">🚚 Dispatch Rider</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="ETA (e.g. 25 mins)" 
                              value={etaInputs[order._id] || ''} 
                              onChange={e => setEtaInputs(prev => ({...prev, [order._id]: e.target.value}))} 
                              className="flex-1 bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-sm text-stone-100 outline-none focus:border-amber-500"
                            />
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDispatch(order); }}
                              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg transition-colors"
                            >
                              Dispatch →
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Standard Flow Buttons */
                        NEXT_STATUS[order.status] && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(order._id, NEXT_STATUS[order.status]) }}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors capitalize ${
                              NEXT_STATUS[order.status] === 'arrived' 
                                ? 'bg-pink-600 hover:bg-pink-500 text-stone-100' 
                                : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                            }`}
                          >
                            {NEXT_STATUS[order.status] === 'arrived' ? '🚨 Rider is Here' : `Mark as ${NEXT_STATUS[order.status].replace(/_/g, ' ')} →`}
                          </button>
                        )
                      )}

                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(order._id, 'cancelled') }}
                          className="px-4 py-1.5 bg-red-900/50 hover:bg-red-800/60 text-red-300 text-xs font-medium rounded-lg transition-colors"
                        >
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