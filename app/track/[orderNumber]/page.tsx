'use client'
import { useState, useEffect } from 'react'
import { IOrder } from '@/lib/types'

// 🚚 Dynamic Steps Generator
const getSteps = (orderType: string) => {
  const isDelivery = orderType === 'delivery';
  return [
    { key: 'pending',          label: 'Placed',       emoji: '🕐', desc: 'We received your order' },
    { key: 'confirmed',        label: 'Confirmed',    emoji: '✅', desc: 'Kitchen accepted it' },
    { key: 'preparing',        label: 'Preparing',    emoji: '🍳', desc: "Chef is cooking" },
    { key: 'ready',            label: 'Ready',        emoji: '🛍️', desc: isDelivery ? 'Awaiting rider' : 'Ready for you!' },
    ...(isDelivery ? [
      { key: 'out_for_delivery', label: 'On The Way', emoji: '🛵', desc: 'Rider has your food' },
      { key: 'arrived',          label: 'Arrived',    emoji: '🚨', desc: 'Rider is here!' },
    ] : []),
    { key: 'delivered',        label: 'Completed',    emoji: '🎉', desc: 'Enjoy your meal!' },
  ]
}

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
    // Poll every 15 seconds for real-time status updates!
    const interval = setInterval(fetchOrder, 15000)
    return () => clearInterval(interval)
  }, [params.orderNumber])

  const steps = order ? getSteps(order.orderType) : []
  const currentStepIndex = order ? steps.findIndex((s) => s.key === order.status) : -1

  if (loading) return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <div className="text-amber-500 animate-pulse font-bold tracking-widest uppercase text-sm">Loading your order...</div>
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
          <p className="text-stone-500 text-sm mb-1 uppercase tracking-widest font-semibold">Order Tracking</p>
          <h1 className="font-mono text-3xl font-bold text-amber-400">{order.orderNumber}</h1>
          <p className="text-stone-500 text-xs mt-2">Placed at {formatTime(order.createdAt as string)}</p>
        </div>

        {/* 🚨 Dynamic Real-Time Big Display */}
        {currentStepIndex >= 0 && (
          <div className={`border rounded-3xl p-6 text-center mb-8 transition-colors duration-500 shadow-2xl ${
            order.status === 'out_for_delivery' ? 'bg-purple-900/20 border-purple-500/30 shadow-purple-900/20' :
            order.status === 'arrived' ? 'bg-pink-900/20 border-pink-500/30 shadow-pink-900/20' :
            order.status === 'delivered' ? 'bg-emerald-900/20 border-emerald-500/30 shadow-emerald-900/20' :
            'bg-stone-900 border-stone-800'
          }`}>
            <div className={`text-7xl mb-4 ${order.status === 'arrived' ? 'animate-bounce' : ''}`}>
              {steps[currentStepIndex].emoji}
            </div>
            
            <h2 className={`text-2xl font-bold mb-1 ${
              order.status === 'out_for_delivery' ? 'text-purple-400' :
              order.status === 'arrived' ? 'text-pink-400' :
              order.status === 'delivered' ? 'text-emerald-400' :
              'text-amber-400'
            }`}>
              {steps[currentStepIndex].label}
            </h2>
            <p className="text-stone-300 font-medium text-base">{steps[currentStepIndex].desc}</p>

            {/* ⏱️ Dynamic ETA Injection Box */}
            {order.status === 'out_for_delivery' && order.estimatedTime && (
              <div className="mt-5 inline-block bg-purple-950/80 rounded-2xl px-8 py-4 border border-purple-500/30 animate-pulse">
                <p className="text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">Estimated Arrival</p>
                <p className="text-4xl font-black text-white">{order.estimatedTime}</p>
              </div>
            )}

            {/* 🚨 Arrival Injection Box */}
            {order.status === 'arrived' && (
              <div className="mt-5 inline-block bg-pink-950/80 rounded-2xl px-8 py-4 border border-pink-500/30">
                 <p className="text-pink-300 text-sm font-bold uppercase tracking-wider">Please step out to receive your order!</p>
              </div>
            )}

            {/* 💰 Total Pricing Reminder */}
            <div className="mt-6 pt-5 border-t border-stone-800/50 text-stone-400 text-sm flex justify-center items-center gap-2">
              Total Order Pricing: <span className="font-bold text-lg text-stone-100 bg-stone-950 px-3 py-1 rounded-lg">{formatNaira(order.totalAmount)}</span>
            </div>
          </div>
        )}

        {/* 📊 Horizontal Scrollable Progress Bar */}
        <div className="mb-10 overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex items-start gap-0 min-w-[500px] md:min-w-full">
            {steps.map((step, i) => {
              const isDone = currentStepIndex > i
              const isCurrent = currentStepIndex === i
              const isLast = i === steps.length - 1

              return (
                <div key={step.key} className="flex-1 flex flex-col items-center relative">
                  <div className="flex items-center w-full">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all z-10 ${
                      isDone ? 'bg-amber-500 text-stone-950' :
                      isCurrent ? 'bg-stone-100 text-stone-950 ring-4 ring-stone-100/20' :
                      'bg-stone-800 text-stone-600 border border-stone-700'
                    }`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    {!isLast && (
                      <div className={`h-1 flex-1 transition-all -ml-1 ${isDone ? 'bg-amber-500' : 'bg-stone-800'}`} />
                    )}
                  </div>
                  <p className={`text-xs mt-2 w-20 text-center leading-tight absolute top-8 ${
                    isCurrent ? 'text-stone-100 font-bold' : 
                    isDone ? 'text-amber-400 font-medium' : 'text-stone-600'
                  }`}>
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* 📦 Order Details Summary */}
        <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden mb-6 mt-10">
          <div className="px-5 py-4 border-b border-stone-800 flex justify-between items-center">
            <span className="text-stone-300 font-semibold text-sm uppercase tracking-wider">Order Items</span>
            <span className={`text-xs px-3 py-1 rounded-full font-bold ${
              order.orderType === 'delivery' ? 'bg-blue-900/40 text-blue-400 border border-blue-800/50' :
              order.orderType === 'pickup' ? 'bg-green-900/40 text-green-400 border border-green-800/50' :
              'bg-amber-900/40 text-amber-400 border border-amber-800/50'
            }`}>
              {order.orderType === 'delivery' ? '🚚 Delivery' : order.orderType === 'pickup' ? '🏃 Pickup' : '🍽️ Dine-in'}
            </span>
          </div>
          <div className="divide-y divide-stone-800/50">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between px-5 py-3.5 text-sm">
                <span className="text-stone-300 font-medium">{item.name} <span className="text-stone-500 ml-1">×{item.quantity}</span></span>
                <span className="text-stone-400 font-mono">{formatNaira(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          
          {/* Delivery Fee Line Item */}
          {order.orderType === 'delivery' && (
            <div className="px-5 py-3 border-t border-stone-800/50 flex justify-between text-sm text-stone-400 bg-stone-950/30">
              <span>Logistics Fee</span>
              <span className="font-mono">Included in Total</span>
            </div>
          )}
        </div>

        <p className="text-center text-stone-600 text-xs flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live updates every 15 seconds
        </p>
      </div>
    </div>
  )
}