'use client'
import { useEffect, useRef, useCallback } from 'react'

type EventHandler = (data: any) => void

// 🛡️ Create ONE global audio instance
let kitchenBell: HTMLAudioElement | null = null
let ringCount = 0

if (typeof window !== 'undefined') {
  kitchenBell = new Audio('/bell.mp3')
  
  // 🛎️ Make the bell ring exactly 3 times!
  kitchenBell.addEventListener('ended', () => {
    if (ringCount < 3) {
      ringCount++
      kitchenBell!.currentTime = 0
      kitchenBell!.play().catch(() => {})
    }
  })
}

// Uses Pusher-js for real-time events (or falls back to polling)
export function useRealtime(
  channelName: string,
  events: Record<string, EventHandler>,
  enabled = true
) {
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const lastOrderIdRef = useRef<string | null>(null)
  const isInitialized = useRef<boolean>(false)
  
  const eventsRef = useRef(events)
  useEffect(() => {
    eventsRef.current = events
  }, [events])

  const startPolling = useCallback(() => {
    if (!eventsRef.current['new-order']) return

    pollingRef.current = setInterval(async () => {
      try {
        // ⚡ FORCE LIVE DATA: Added cache: 'no-store' to bypass Next.js caching!
        const res = await fetch('/api/orders?status=pending&limit=1', { cache: 'no-store' })
        const data = await res.json()
        
        if (data.data?.length) {
          const latestId = data.data[0]._id

          if (!isInitialized.current) {
            lastOrderIdRef.current = latestId
            isInitialized.current = true
            return
          }

          if (latestId !== lastOrderIdRef.current) {
            lastOrderIdRef.current = latestId
            eventsRef.current['new-order'](data.data[0]) 
          }
        } else {
          isInitialized.current = true 
        }
      } catch {
        // Silent fail
      }
    }, 8000)
  }, []) 

  useEffect(() => {
    if (!enabled) return

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    if (pusherKey) {
      import('pusher-js').then(({ default: Pusher }) => {
        const pusher = new Pusher(pusherKey, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
        })
        const channel = pusher.subscribe(channelName)
        
        Object.entries(eventsRef.current).forEach(([event, handler]) => {
          channel.bind(event, handler)
        })
        
        return () => {
          channel.unbind_all()
          pusher.unsubscribe(channelName)
        }
      }).catch(() => {
        startPolling()
      })
    } else {
      startPolling()
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [channelName, enabled, startPolling]) 
}

export function playOrderAlert() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const playBeep = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration)
    }
    playBeep(293.66, 0, 0.3)
    playBeep(369.99, 0.25, 0.3)
    playBeep(440, 0.5, 0.5)
  } catch (e) {
    console.warn('Audio alert failed:', e)
  }
}

export function triggerKitchenAlarm(orderNumber: string, customerName: string) {
  if (kitchenBell) {
    ringCount = 1 // Start the 3-ring loop counter!
    kitchenBell.currentTime = 0 
    kitchenBell.play().catch(() => {
      playOrderAlert() 
    })
  } else {
    playOrderAlert()
  }

  if (typeof window !== 'undefined' && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("🛎️ NEW ORDER!", {
        body: `Order ${orderNumber} from ${customerName} is ready.`,
        icon: "/favicon.ico"
      })
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification("🛎️ NEW ORDER!", {
            body: `Order ${orderNumber} from ${customerName} is ready.`,
            icon: "/favicon.ico"
          })
        }
      })
    }
  }
}