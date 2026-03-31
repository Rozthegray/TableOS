import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Reservation, Table } from '@/models'
import { sendSMS, smsTemplates } from '@/lib/notifications'

// ── 1. GET: FETCH RESERVATIONS (For Admin Dashboard) ────────────────────────
export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const status = searchParams.get('status')

    const filter: Record<string, unknown> = {}
    if (status) {
      const statuses = status.split(',').map((s) => s.trim())
      filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0]
    }
    
    if (date && date !== 'undefined' && date !== 'null') {
      const start = new Date(date); start.setHours(0, 0, 0, 0)
      const end = new Date(date); end.setHours(23, 59, 59, 999)
      filter.date = { $gte: start, $lte: end }
    }

    const reservations = await Reservation.find(filter)
      .populate('tableId')
      .sort({ date: 1, timeSlot: 1 })

    return NextResponse.json({ success: true, data: reservations })
    
  } catch (error) {
    console.error('Reservations GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reservations from database' }, 
      { status: 500 }
    )
  }
}

// ── 2. POST: CREATE RESERVATION (For Customer Booking) ──────────────────────
export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const body = await req.json()
    const { date, timeSlot, guests, customer, notes, skipAutoAssign, tableId: requestedTableId } = body

    let assignedTable = null

    if (skipAutoAssign && requestedTableId) {
      // 1. Find the table to get its real MongoDB _id
      assignedTable = await Table.findOne({ name: requestedTableId })
      if (!assignedTable) {
        assignedTable = await Table.findById(requestedTableId).catch(() => null)
      }
      
      if (!assignedTable) {
        return NextResponse.json({ success: false, error: 'Table not found' }, { status: 404 })
      }

      // 2. Check for conflicts using the valid assignedTable._id
      const conflict = await Reservation.findOne({
        tableId: assignedTable._id,
        date: {
          $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
        },
        timeSlot,
        status: { $in: ['pending', 'confirmed', 'seated'] },
      })

      if (conflict) {
        return NextResponse.json(
          { success: false, error: 'This table is already reserved. Please pick another.' },
          { status: 409 }
        )
      }

    } else {
      // ── AUTO-ASSIGNMENT MODE ─────────────────────────────────────────────
      const eligibleTables = await Table.find({
        section: 'restaurant',
        capacity: { $gte: guests },
      }).sort({ capacity: 1 })

      if (!eligibleTables.length) {
        return NextResponse.json({ success: false, error: 'No tables for this party size' }, { status: 400 })
      }

      const conflicting = await Reservation.find({
        date: {
          $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
        },
        timeSlot,
        status: { $in: ['pending', 'confirmed', 'seated'] },
      }).select('tableId')

      const bookedIds = conflicting.map((r) => r.tableId.toString())
      assignedTable = eligibleTables.find((t) => !bookedIds.includes(t._id.toString()))

      if (!assignedTable) {
        return NextResponse.json(
          { success: false, error: 'All suitable tables are booked for this slot' },
          { status: 409 }
        )
      }
    }

    // ── CREATE RESERVATION ─────────────────────────────────────────────
    const reservation = await Reservation.create({
      tableId: assignedTable._id,
      customer,
      date: new Date(date),
      timeSlot,
      guests,
      notes,
      status: 'pending',
    })

    if (customer.phone) {
      const dateFormatted = new Date(date).toLocaleDateString('en-NG', {
        weekday: 'short', day: 'numeric', month: 'short',
      })
      sendSMS(
        customer.phone,
        smsTemplates.reservationConfirmed(customer.name, dateFormatted, timeSlot, assignedTable.name)
      ).catch(console.error)
    }

    return NextResponse.json(
      { success: true, data: { ...reservation.toObject(), table: assignedTable } },
      { status: 201 }
    )
    
  } catch (err: unknown) {
    console.error('Reservation POST Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}