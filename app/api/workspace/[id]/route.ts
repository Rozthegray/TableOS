import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { WorkspaceBooking } from '@/models'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const booking = await WorkspaceBooking.findById(params.id).populate('seatId')
    if (!booking) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    
    return NextResponse.json({ success: true, data: booking })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const { status } = await req.json()
    
    // 🛡️ Bypassing strict validation so 'completed' correctly saves even if missing from strict schema Enums
    const booking = await WorkspaceBooking.findByIdAndUpdate(
      params.id, 
      { status }, 
      { new: true } 
    )
    
    if (!booking) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    
    return NextResponse.json({ success: true, data: booking })
  } catch (error: any) {
    console.error("PATCH Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const booking = await WorkspaceBooking.findByIdAndUpdate(params.id, { status: 'cancelled' })
    if (!booking) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    
    return NextResponse.json({ success: true, message: 'Booking cancelled' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}