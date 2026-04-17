import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Delivery } from '@/models'
import Order from '@/models/Order'
import { getSettings } from '@/models/Settings' // 👈 Import settings
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
const order = await Order.findById(orderId) as any
  if (!order || order.orderType !== 'delivery') {
    return NextResponse.json({ success: false, error: 'Invalid delivery order' }, { status: 400 })
  }

  try {
    const settings = await getSettings()
    let kwikTrackingUrl = ''
    let kwikTaskId = ''

    // 🏍️ KWIK AUTO-DISPATCH LOGIC
    if (settings.deliveryMode === 'auto' && settings.kwikEmail && settings.kwikPassword) {
      // 1. Login to Kwik
      const authRes = await fetch('https://api.kwik.delivery/api/v1/vendor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: settings.kwikEmail, password: settings.kwikPassword })
      })
      const authData = await authRes.json()
      
      if (authData.status === 200 && authData.data?.access_token) {
        const token = authData.data.access_token

        // 2. Dispatch the Rider
        const deliveryAddress = address || order.customer.address
        const taskRes = await fetch('https://api.kwik.delivery/api/v1/task/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            deliveries: [{
              pickup_address: settings.restaurantAddress,
              delivery_address: deliveryAddress,
              recipient_name: order.customer.name,
              recipient_phone: order.customer.phone,
              amount: order.totalAmount, // Helps Kwik know package value
            }],
            vehicle_id: 1, // Motorbike
            payment_method: 1 // Online/Pre-paid (since Paystack handled it)
          })
        })

        const taskData = await taskRes.json()
        
        if (taskData.status === 200) {
          // Kwik successfully dispatched a rider!
          kwikTaskId = taskData.data.task_id
          kwikTrackingUrl = taskData.data.tracking_url
        }
      }
    }

    // 📦 Create local delivery record
    const delivery = await Delivery.create({
      orderId,
      rider: settings.deliveryMode === 'auto' ? 'Kwik Dispatch' : rider,
      address: address || order.customer.address,
      estimatedTime,
      status: 'assigned',
      // You can save Kwik info here if your Schema supports it
      trackingUrl: kwikTrackingUrl, 
      externalId: kwikTaskId
    })

    // Update order status
    await Order.findByIdAndUpdate(orderId, { status: 'preparing' })

    // 📱 Optional: Send SMS to customer that rider is dispatched
  // 📱 Send SMS to customer that rider is dispatched
    if (order.customer.phone) {
      await sendSMS(
        order.customer.phone,
        kwikTrackingUrl
          ? `Your TableOS order #${order.orderNumber} is on the way via Kwik! Track it here: ${kwikTrackingUrl}`
          : `Your TableOS order #${order.orderNumber} has been dispatched and is on its way! Our rider will contact you shortly.`
      )
    }

    return NextResponse.json({ success: true, data: delivery }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}