import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Table, Reservation, WorkspaceBooking } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const section = searchParams.get('section') || 'restaurant'
    const date = searchParams.get('date')
    const timeSlot = searchParams.get('timeSlot')

    // Get all tables for this section
    const tables = await Table.find({ section })

    // Build status map: tableId → status
    const statusMap: Record<string, 'free' | 'reserved' | 'occupied'> = {}

    // Default all to free
    tables.forEach((t) => { 
      statusMap[t._id.toString()] = t.status as 'free' | 'reserved' | 'occupied' 
    })

    if (date) {
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      if (section === 'restaurant') {
        // Check reservations for this date + time slot
        const reservationQuery: Record<string, unknown> = {
          date: { $gte: dayStart, $lte: dayEnd },
          status: { $in: ['pending', 'confirmed', 'seated'] },
        }
        if (timeSlot) reservationQuery.timeSlot = timeSlot

        const reservations = await Reservation.find(reservationQuery).select('tableId status')
        reservations.forEach((r) => {
          const id = r.tableId.toString()
          // Map reservation status to table display status
          if (r.status === 'seated') statusMap[id] = 'occupied'
          else statusMap[id] = 'reserved'
        })
      } else {
        // Workspace: check bookings for this date
        // NOTE: Make sure WorkspaceBooking model is properly exported in @/models!
        const bookings = await WorkspaceBooking.find({
          date: { $gte: dayStart, $lte: dayEnd },
          status: { $in: ['pending', 'active'] },
        }).select('seatId status')

        bookings.forEach((b) => {
          const id = b.seatId.toString()
          statusMap[id] = b.status === 'active' ? 'occupied' : 'reserved'
        })
      }
    }

    // Return map keyed by table NAME (not _id) for the frontend layout to match
    const tableNameMap: Record<string, 'free' | 'reserved' | 'occupied'> = {}
    tables.forEach((t) => {
      tableNameMap[t.name] = statusMap[t._id.toString()]
    })

    return NextResponse.json({ success: true, data: tableNameMap })

  } catch (error) {
    console.error('Availability API Error:', error)
    // 🛡️ Safe JSON fallback
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}