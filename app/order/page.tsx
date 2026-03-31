'use client'
import { useState, useEffect } from 'react'
import { IOrder, OrderStatus } from '../../lib/types'

const STATUS_STEPS: { key: OrderStatus; label: string; emoji: string; desc: string }[] = [
  { key: 'pending',    label: 'Order Placed',   emoji: '🕐', desc: 'We received your order' },
  { key: 'confirmed',  label: 'Confirmed',      emoji: '✅', desc: 'Kitchen has accepted it' },
  { key: 'preparing', label: 'Preparing',      emoji: '🍳', desc: "Chef's working on it" },
  { key: 'ready',     label: 'Ready',          emoji: '🔔', desc: 'Coming your way soon!' },
  { key: 'delivered', label: 'Delivered',      emoji: '🎉', desc: 'Enjoy your meal!' },
]

function formatNaira(n: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}

export default function TrackPage({ params }: { params: { orderNumber: string } }) {
  const [order, setOrder] = useState<IOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders?orderNumber=${params.orderNumber}&limit=1`)
      const data = await res.json()
      if (data.data?.length) {
        setOrder(data.data[0])
      } else {
        setError('Order not found. Please check your order number.')
      }
    } catch {
      setError('Failed to load order.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
    // Poll every 15 seconds for status updates
    const interval = setInterval(fetchOrder, 15000)
    return () => clearInterval(interval)
  }, [params.orderNumber])

  const currentStepIndex = order
    ? STATUS_STEPS.findIndex((s) => s.key === order.status)
    : -1

  if (loading) return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <div className="text-stone-500 animate-pulse">Loading your order...</div>
    </div>
  )

  if (error || !order) return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-stone-400">{error || 'Order not found'}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-stone-500 text-sm mb-1">Order</p>
          <h1 className="font-mono text-2xl font-bold text-amber-400">{order.orderNumber}</h1>
          <p className="text-stone-500 text-sm mt-1">Placed at {formatTime(order.createdAt)}</p>
        </div>

        {/* Current status big display */}
        {currentStepIndex >= 0 && (
          <div className="bg-stone-900 border border-stone-700 rounded-2xl p-6 text-center mb-6">
            <div className="text-6xl mb-3">{STATUS_STEPS[currentStepIndex].emoji}</div>
            <h2 className="text-xl font-bold text-amber-400">{STATUS_STEPS[currentStepIndex].label}</h2>
            <p className="text-stone-400 text-sm mt-1">{STATUS_STEPS[currentStepIndex].desc}</p>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-start gap-0">
            {STATUS_STEPS.filter((s) => s.key !== 'cancelled').map((step, i) => {
              const isDone = currentStepIndex > i
              const isCurrent = currentStepIndex === i
              const isLast = i === STATUS_STEPS.length - 1

              return (
                <div key={step.key} className="flex-1 flex flex-col items-center">
                  <div className="flex items-center w-full">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all ${
                      isDone ? 'bg-green-600 text-white' :
                      isCurrent ? 'bg-amber-500 text-stone-950 ring-4 ring-amber-500/20' :
                      'bg-stone-800 text-stone-600'
                    }`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    {!isLast && (
                      <div className={`h-0.5 flex-1 transition-all ${isDone ? 'bg-green-600' : 'bg-stone-700'}`} />
                    )}
                  </div>
                  <p className={`text-xs mt-1.5 text-center leading-tight ${isCurrent ? 'text-amber-400 font-semibold' : isDone ? 'text-green-400' : 'text-stone-600'}`}>
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order details */}
        <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-stone-800 flex justify-between items-center">
            <span className="text-stone-400 text-sm">Order Details</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              order.orderType === 'delivery' ? 'bg-blue-900/40 text-blue-400' :
              order.orderType === 'pickup' ? 'bg-green-900/40 text-green-400' :
              'bg-amber-900/40 text-amber-400'
            }`}>
              {order.orderType === 'delivery' ? '🚚 Delivery' : order.orderType === 'pickup' ? '🏃 Pickup' : '🍽️ Dine-in'}
            </span>
          </div>
          <div className="divide-y divide-stone-800">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between px-5 py-3 text-sm">
                <span className="text-stone-300">{item.name} <span className="text-stone-500">×{item.quantity}</span></span>
                <span className="text-stone-400">{formatNaira(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-stone-800 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-amber-400">{formatNaira(order.totalAmount)}</span>
          </div>
        </div>

        {/* Auto-refresh notice */}
        <p className="text-center text-stone-600 text-xs">
          This page refreshes automatically every 15 seconds
        </p>
      </div>
    </div>
  )
}