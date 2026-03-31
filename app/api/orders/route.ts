import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'
import { sendSMS, smsTemplates } from '@/lib/notifications'

// GET /api/orders — list orders (admin) with filters
export async function GET(req: NextRequest) {
  await dbConnect()
  const { searchParams } = new URL(req.url)

  const filter: Record<string, unknown> = {}
  const status = searchParams.get('status')
  const orderType = searchParams.get('orderType')
  const date = searchParams.get('date')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  if (status) filter.status = status
  if (orderType) filter.orderType = orderType
  if (date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    filter.createdAt = { $gte: start, $lte: end }
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ])

  return NextResponse.json({ success: true, data: orders, total, page, limit })
}

// POST /api/orders — create new order
export async function POST(req: NextRequest) {
  await dbConnect()
  const body = await req.json()

  try {
    const order = await Order.create(body)

    // Send SMS confirmation
    if (order.customer.phone) {
      sendSMS(
        order.customer.phone,
        smsTemplates.orderConfirmed(order.orderNumber, order.customer.name)
      ).catch(console.error)
    }

    // Emit socket event (if using Pusher/Socket.io)
    try {
      const pusherAppId = process.env.PUSHER_APP_ID
      if (pusherAppId) {
        await fetch(`/api/notifications/emit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'new-order', data: order }),
        })
      }
    } catch {
      // Non-blocking — notifications shouldn't break order creation
    }

    return NextResponse.json({ success: true, data: order }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
