import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'
import { WorkspaceBooking } from '@/models'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!

// POST /api/payments/verify — verify paystack payment
export async function POST(req: NextRequest) {
  const { reference, type, resourceId } = await req.json()

  if (!reference) {
    return NextResponse.json({ success: false, error: 'Reference required' }, { status: 400 })
  }

  // Verify with Paystack
  const paystackRes = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
      },
    }
  )

  const paystackData = await paystackRes.json()

  if (!paystackData.status || paystackData.data.status !== 'success') {
    return NextResponse.json({ success: false, error: 'Payment not successful' }, { status: 400 })
  }

  await dbConnect()

  // Update the relevant resource
  if (type === 'order' && resourceId) {
    await Order.findByIdAndUpdate(resourceId, {
      paymentStatus: 'paid',
      paystackRef: reference,
      paymentMethod: 'paystack',
    })
  } else if (type === 'workspace' && resourceId) {
    await WorkspaceBooking.findByIdAndUpdate(resourceId, {
      status: 'active',
      paystackRef: reference,
    })
  }

  return NextResponse.json({
    success: true,
    message: 'Payment verified',
    amount: paystackData.data.amount / 100, // convert from kobo
  })
}
