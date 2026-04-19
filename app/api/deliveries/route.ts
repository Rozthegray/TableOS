import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Delivery } from '@/models'
import Order from '@/models/Order'
import { getSettings } from '@/models/Settings' 
import { sendSMS } from '@/lib/notifications'

// 🧹 Sanitizer to prevent Fez's routing engine from choking on long LocationIQ strings
function simplifyAddress(fullAddress: string) {
  if (!fullAddress) return "Lagos, Nigeria";
  const parts = fullAddress.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    return `${parts[0]}, ${parts[1]}, Lagos, Nigeria`;
  }
  return fullAddress;
}

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
    let fezTrackingUrl = ''
    let fezTaskId = ''

    // 🏍️ FEZ AUTO-DISPATCH LOGIC
    if (settings.deliveryMode === 'auto' && settings.fezApiKey) {
      
      const itemDescriptions = order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')
      const deliveryAddress = address || order.customer.address

      // Use the strict GPS coordinates as FLOATS and sanitize the addresses
      const fezPayload = {
        pickup_address: simplifyAddress(settings.restaurantAddress),
        pickup_lat: parseFloat(settings.restaurantLat || "6.4446"), 
        pickup_lng: parseFloat(settings.restaurantLng || "3.4602"),
        delivery_address: simplifyAddress(deliveryAddress),
        delivery_lat: parseFloat(order.customer?.lat || "6.5244"), 
        delivery_lng: parseFloat(order.customer?.lng || "3.3792"),
        receiver_name: order.customer.name,
        receiver_phone: order.customer.phone,
        item_description: `Order ${order.orderNumber}: ${itemDescriptions}`
      }

      try {
        const taskRes = await fetch('https://api.fezdelivery.co/v1/order', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.fezApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(fezPayload)
        })

        const taskData = await taskRes.json()
        
        if (taskRes.ok && taskData.status !== 'Error' && taskData.status !== 'error') {
          // Fez successfully dispatched a rider!
          fezTaskId = taskData.data?.id || taskData.id || ''
          fezTrackingUrl = taskData.data?.tracking_link || '' 
          console.log("✅ Fez Rider Dispatched Successfully!", fezTaskId)
        } else {
          console.warn("⚠️ Fez Dispatch Warning:", taskData)
        }
      } catch (fezError) {
        console.error("Fez API Connection Error:", fezError)
      }
    }

    // 📦 Create local delivery record
    const delivery = await Delivery.create({
      orderId,
      rider: settings.deliveryMode === 'auto' ? 'Fez Dispatch' : rider,
      address: address || order.customer.address,
      estimatedTime,
      status: 'assigned',
      trackingUrl: fezTrackingUrl, 
      externalId: fezTaskId
    })

    // Update order status
    await Order.findByIdAndUpdate(orderId, { status: 'preparing' })

    // 📱 Send SMS to customer that rider is dispatched
    if (order.customer.phone) {
      await sendSMS(
        order.customer.phone,
        fezTrackingUrl
          ? `Your TableOS order #${order.orderNumber} is on the way via Fez Delivery! Track it here: ${fezTrackingUrl}`
          : `Your TableOS order #${order.orderNumber} has been dispatched and is on its way! Our rider will contact you shortly.`
      )
    }

    return NextResponse.json({ success: true, data: delivery }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}