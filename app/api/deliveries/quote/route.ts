export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { getSettings } from '@/models/Settings'

// 👇 The 'export' keyword right here is what Vercel/Next.js was crying about!
export async function POST(req: Request) {
  try {
    await dbConnect()
    const { customerAddress } = await req.json()

    if (!customerAddress) {
      return NextResponse.json({ success: false, error: 'Customer address is required' }, { status: 400 })
    }

    const settings = await getSettings()
    
    // Safety check: ensure Kwik is enabled and configured in Admin Settings
    if (settings.deliveryMode !== 'auto' || !settings.kwikEmail || !settings.kwikPassword) {
      return NextResponse.json({ success: false, error: 'Kwik delivery is not fully configured.' }, { status: 400 })
    }

    if (!settings.restaurantAddress) {
      return NextResponse.json({ success: false, error: 'Restaurant pickup address is missing in Admin Settings.' }, { status: 400 })
    }

    // 1. Authenticate with Kwik API to get a fresh token
    const authRes = await fetch('https://api.kwik.delivery/api/v1/vendor/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: settings.kwikEmail,
        password: settings.kwikPassword
      })
    })
    
    const authData = await authRes.json()
    
    if (authData.status !== 200 || !authData.data?.access_token) {
      console.error('Kwik Auth Error:', authData)
      throw new Error('Failed to authenticate with Kwik API. Check credentials.')
    }

    const token = authData.data.access_token

    // 2. Ask Kwik for the real-time price estimate
    const estimateRes = await fetch('https://api.kwik.delivery/api/v1/task/price-estimate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deliveries: [{
          pickup_address: settings.restaurantAddress,
          delivery_address: customerAddress
        }],
        vehicle_id: 1 // 1 is Kwik's code for a Motorbike (perfect for food)
      })
    })

    const estimateData = await estimateRes.json()

    if (estimateData.status !== 200) {
      console.error('Kwik Estimate Error:', estimateData)
      throw new Error('Could not calculate delivery distance to this address.')
    }

    // 3. Return the exact delivery fee to the TableOS checkout
    return NextResponse.json({ 
      success: true, 
      deliveryFee: estimateData.data.total_amount
    })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
