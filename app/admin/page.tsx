'use client'
import { useState, useEffect, useCallback } from 'react'
import { DashboardStats, IOrder } from '@/lib/types'
// 🛡️ Added triggerKitchenAlarm here:
import { useRealtime, playOrderAlert, triggerKitchenAlarm } from '../../hooks/useRealtime'

function formatNaira(n: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
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
  pending:   'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready:     'delivered',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<IOrder[]>([])
  const [newOrderAlert, setNewOrderAlert] = useState<IOrder | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

const fetchStats = useCallback(async () => {
    // ⚡ FORCE LIVE DATA: Added cache: 'no-store' to both requests!
    const [statsRes, ordersRes] = await Promise.all([
      fetch('/api/admin/stats', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/orders?limit=15', { cache: 'no-store' }).then((r) => r.json()),
    ])
    if (statsRes.success) setStats(statsRes.data)
    if (ordersRes.success) setOrders(ordersRes.data)
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  // Real-time new order alert
  useRealtime('restaurant-os', {
    'new-order': (data) => {
      const order = data as IOrder
      setNewOrderAlert(order)
      
      // 🛎️ FIRE THE NEW SUPER ALARM!
      triggerKitchenAlarm(order.orderNumber, order.customer.name)
      
      // Flash the tab title
      const orig = document.title
      let count = 0
      const blink = setInterval(() => {
        document.title = count % 2 === 0 ? '🔔 NEW ORDER!' : orig
        if (++count > 10) { clearInterval(blink); document.title = orig }
      }, 500)
      fetchStats()
    },
  })

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId)
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setUpdatingId(null)
    fetchStats()
  }

  const statCards = stats ? [
    { label: "Today's Orders", value: stats.todayOrders, icon: '📦', color: 'text-blue-400' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: '⏳', color: 'text-amber-400', highlight: stats.pendingOrders > 0 },
    { label: "Today's Revenue", value: formatNaira(stats.todayRevenue), icon: '💰', color: 'text-green-400' },
    { label: 'Active Reservations', value: stats.activeReservations, icon: '🪑', color: 'text-purple-400' },
    { label: 'Workspace Members', value: stats.activeWorkspaceBookings, icon: '💻', color: 'text-cyan-400' },
  ] : []

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6">
      {/* New order alert banner */}
      {newOrderAlert && (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-stone-950 px-4 py-3 flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <span className="font-bold">NEW ORDER</span>
              <span className="ml-2">{newOrderAlert.orderNumber} — {newOrderAlert.customer.name} — {formatNaira(newOrderAlert.totalAmount)}</span>
            </div>
          </div>
          <button onClick={() => setNewOrderAlert(null)} className="font-bold hover:opacity-70">✕</button>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        
        {/* Cleaned up Header (No redundant navigation) */}
     {/* Cleaned up Header (No redundant navigation) */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="font-serif text-3xl font-bold text-amber-400">Dashboard Overview</h1>
            <p className="text-stone-500 text-sm mt-1">{new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          
          {/* 🛎️ AUDIO UNLOCK BUTTON */}
          <button 
            onClick={() => triggerKitchenAlarm('TEST', 'Audio Check')}
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-300 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <span>🛎️</span> Test Alarm
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((card) => (
            <div key={card.label}
              className={`bg-stone-900 rounded-xl p-4 border transition-all ${
                card.highlight ? 'border-amber-500 shadow-amber-500/10 shadow-lg' : 'border-stone-800'
              }`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-2xl">{card.icon}</span>
                {card.highlight && <span className="text-xs bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
              </div>
              <div className={`text-2xl font-bold mb-1 ${card.color}`}>{card.value}</div>
              <div className="text-stone-500 text-xs">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Weekly revenue bars */}
        {stats?.weeklyRevenue && (
          <div className="bg-stone-900 rounded-xl border border-stone-800 p-5 mb-8">
            <h3 className="text-sm font-semibold text-stone-400 mb-4 uppercase tracking-wider">Weekly Revenue</h3>
            <div className="flex items-end gap-2 h-24">
              {stats.weeklyRevenue.map((val, i) => {
                const max = Math.max(...stats.weeklyRevenue, 1)
                const height = Math.max(4, (val / max) * 96)
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                const dayIndex = (new Date().getDay() + 6 - (6 - i)) % 7
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-amber-500 rounded-t-md transition-all" style={{ height: `${height}px` }} title={formatNaira(val)} />
                    <span className="text-xs text-stone-600">{days[dayIndex]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent orders table */}
        <div className="bg-stone-900 rounded-xl border border-stone-800">
          <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
            <h3 className="font-semibold text-stone-200">Recent Orders</h3>
            <a href="/admin/orders" className="text-amber-400 text-sm hover:text-amber-300">View all →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-800 text-stone-500 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Order #</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-left">Time</th>
                  <th className="px-5 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-stone-800/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-amber-400 text-xs">{order.orderNumber}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-stone-200">{order.customer.name}</div>
                      <div className="text-stone-500 text-xs">{order.customer.phone}</div>
                    </td>
                    <td className="px-5 py-3 text-stone-400 capitalize">{order.orderType}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || ''}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-stone-200">{formatNaira(order.totalAmount)}</td>
                    <td className="px-5 py-3 text-stone-500 text-xs">{timeAgo(order.createdAt)}</td>
                    <td className="px-5 py-3">
                      {NEXT_STATUS[order.status] && (
                        <button
                          onClick={() => updateStatus(order._id, NEXT_STATUS[order.status])}
                          disabled={updatingId === order._id}
                          className="text-xs bg-stone-700 hover:bg-amber-500 hover:text-stone-950 text-stone-300 px-3 py-1 rounded-lg transition-all disabled:opacity-50 capitalize">
                          {updatingId === order._id ? '...' : `→ ${NEXT_STATUS[order.status]}`}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-stone-600">No orders yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}