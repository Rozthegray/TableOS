import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Delivery } from '@/models'
import Order from '@/models/Order'
import { sendSMS, smsTemplates } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  await dbConnect()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const filter: Record<string, unknown> = {}
  if (status) filter.status = status

  const deliveries = await Delivery.find(filter).populate('orderId').sort({ createdAt: -1 })
  return NextResponse.json({ success: true, data: deliveries })
}

// POST /api/deliveries — create delivery record + assign rider
export async function POST(req: NextRequest) {
  await dbConnect()
  const body = await req.json()
  const { orderId, rider, address, estimatedTime } = body

  // Verify order exists and is a delivery order
  const order = await Order.findById(orderId)
  if (!order || order.orderType !== 'delivery') {
    return NextResponse.json({ success: false, error: 'Invalid delivery order' }, { status: 400 })
  }

  try {
    const delivery = await Delivery.create({
      orderId,
      rider,
      address: address || order.customer.address,
      estimatedTime,
      status: rider ? 'assigned' : 'assigned',
    })

    // Update order status
    await Order.findByIdAndUpdate(orderId, { status: 'preparing' })

    return NextResponse.json({ success: true, data: delivery }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
