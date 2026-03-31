import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { WorkspaceBooking, Table } from '@/models'
import { sendSMS, smsTemplates } from '@/lib/notifications'

const WORKSPACE_PRICING = {
  daily: 2000,   // ₦2,000
  monthly: 25000, // ₦25,000
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const plan = searchParams.get('plan')

    const filter: Record<string, unknown> = {}
    if (status) filter.status = status
    if (plan) filter.plan = plan
    
    // Safely parse date
    if (date && date !== 'undefined' && date !== 'null') {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      filter.date = { $gte: start, $lte: end }
    }

    const bookings = await WorkspaceBooking.find(filter)
      .populate('seatId')
      .sort({ date: -1 })

    return NextResponse.json({ success: true, data: bookings })
  } catch (error) {
    console.error('Workspace GET Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const body = await req.json()
    // 🛡️ Ensure we pull the specific seatId the frontend sent
    const { plan, date, user, seatId: requestedSeatId } = body

    const amount = WORKSPACE_PRICING[plan as keyof typeof WORKSPACE_PRICING]
    if (!amount) {
      return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 })
    }

    // 1. Find the exact seat the user clicked on the map
    let seat = await Table.findOne({ name: requestedSeatId, section: 'workspace' })
    if (!seat) {
      seat = await Table.findById(requestedSeatId).catch(() => null)
    }

    if (!seat) {
      return NextResponse.json({ success: false, error: 'Workspace seat not found' }, { status: 404 })
    }

    // 2. 🛡️ AVAILABILITY CHECK: Is THIS specific seat already booked today?
    const conflict = await WorkspaceBooking.findOne({
      seatId: seat._id,
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
      },
      status: { $in: ['pending', 'active'] },
    })

    if (conflict) {
      return NextResponse.json(
        { success: false, error: `Sorry, ${seat.name} was just booked by someone else. Please pick another desk.` },
        { status: 409 }
      )
    }

    // Calculate endDate for monthly plans
    const endDate =
      plan === 'monthly'
        ? new Date(new Date(date).setMonth(new Date(date).getMonth() + 1))
        : undefined

    // 3. Create the booking lock
    const booking = await WorkspaceBooking.create({
      seatId: seat._id,
      user,
      plan,
      date: new Date(date),
      endDate,
      amount,
      status: 'pending',
    })

    // SMS notification
    if (user.phone) {
      const dateFormatted = new Date(date).toLocaleDateString('en-NG', {
        weekday: 'short', day: 'numeric', month: 'short',
      })
      sendSMS(
        user.phone,
        smsTemplates.workspaceConfirmed(user.name, dateFormatted, plan)
      ).catch(console.error)
    }

    return NextResponse.json(
      { success: true, data: { ...booking.toObject(), seat } },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error('Workspace POST Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}