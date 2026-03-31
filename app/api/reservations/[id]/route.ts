import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Reservation, Table } from '@/models'
import { sendSMS, smsTemplates } from '@/lib/notifications'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const reservation = await Reservation.findById(params.id).populate('tableId')
  if (!reservation)
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true, data: reservation })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const body = await req.json()
  const { status } = body

  const reservation = await Reservation.findByIdAndUpdate(
    params.id,
    { status },
    { new: true }
  ).populate('tableId')

  if (!reservation)
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  // Update table status based on reservation status
  if (status === 'seated') {
    await Table.findByIdAndUpdate(reservation.tableId, { status: 'occupied' })
  } else if (status === 'completed' || status === 'cancelled') {
    await Table.findByIdAndUpdate(reservation.tableId, { status: 'free' })
  } else if (status === 'confirmed') {
    await Table.findByIdAndUpdate(reservation.tableId, { status: 'reserved' })
  }

  // Notify customer on confirmation
  if (status === 'confirmed' && reservation.customer.phone) {
    const dateFormatted = new Date(reservation.date).toLocaleDateString('en-NG', {
      weekday: 'short', day: 'numeric', month: 'short',
    })
    sendSMS(
      reservation.customer.phone,
      smsTemplates.reservationConfirmed(
        reservation.customer.name,
        dateFormatted,
        reservation.timeSlot,
        (reservation.tableId as unknown as { name: string }).name
      )
    ).catch(console.error)
  }

  return NextResponse.json({ success: true, data: reservation })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const reservation = await Reservation.findByIdAndUpdate(
    params.id,
    { status: 'cancelled' },
    { new: true }
  )
  if (reservation) {
    await Table.findByIdAndUpdate(reservation.tableId, { status: 'free' })
  }
  return NextResponse.json({ success: true, message: 'Reservation cancelled' })
}
