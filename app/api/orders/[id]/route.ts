import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'
import { sendSMS, smsTemplates } from '@/lib/notifications'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const order = await Order.findById(params.id)
  if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
  return NextResponse.json({ success: true, data: order })
}

// PATCH /api/orders/[id] — update status (admin/kitchen)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const body = await req.json()
  const { status, paymentStatus, paymentMethod } = body

  const update: Record<string, unknown> = {}
  if (status) update.status = status
  if (paymentStatus) update.paymentStatus = paymentStatus
  if (paymentMethod) update.paymentMethod = paymentMethod

  const order = await Order.findByIdAndUpdate(params.id, update, { new: true })
  if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })

  // Send SMS on key status changes
  if (status && order.customer.phone) {
    let msg: string | null = null

    if (status === 'confirmed') {
      msg = smsTemplates.orderConfirmed(order.orderNumber, order.customer.name)
    } else if (status === 'preparing') {
      msg = smsTemplates.orderPreparing(order.orderNumber)
    } else if (status === 'ready') {
      msg = smsTemplates.orderReady(order.orderNumber, order.orderType)
    } else if (status === 'delivered') {
      msg = smsTemplates.orderDelivered(order.orderNumber)
    }

    if (msg) {
      sendSMS(order.customer.phone, msg).catch(console.error)
    }
  }

  return NextResponse.json({ success: true, data: order })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  await Order.findByIdAndUpdate(params.id, { status: 'cancelled' })
  return NextResponse.json({ success: true, message: 'Order cancelled' })
}
