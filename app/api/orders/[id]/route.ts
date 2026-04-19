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
  const { status, paymentStatus, paymentMethod, estimatedTime } = body

  const update: Record<string, unknown> = {}
  if (status) update.status = status
  if (paymentStatus) update.paymentStatus = paymentStatus
  if (paymentMethod) update.paymentMethod = paymentMethod

  const order = await Order.findByIdAndUpdate(params.id, update, { new: true })
  if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })

  // 📱 Send SMS on key status changes
  if (status && order.customer.phone) {
    let msg: string | null = null
    const formattedTotal = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(order.totalAmount)

    if (status === 'confirmed') {
      msg = `Your TableOS order #${order.orderNumber} is confirmed! Total: ${formattedTotal}.`
    } else if (status === 'preparing') {
      msg = `We are preparing your order #${order.orderNumber}.`
    } else if (status === 'ready') {
      msg = `Your order #${order.orderNumber} is ready!`
    } 
    // 🚚 NEW: The "Out for Delivery" SMS with ETA and Pricing
    else if (status === 'out_for_delivery') {
      msg = `Rider has your food! Estimated time to arrival is: ${estimatedTime || 'shortly'}. Total pricing: ${formattedTotal}.`
    } 
    // 🚨 NEW: The "Rider is Here" SMS
    else if (status === 'arrived') {
      msg = `Rider is here! Please step out to receive your order #${order.orderNumber}.`
    } 
    else if (status === 'delivered') {
      msg = `Order #${order.orderNumber} delivered successfully. Enjoy your meal!`
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