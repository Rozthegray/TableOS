import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import MenuItem from '@/models/MenuItem'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const item = await MenuItem.findById(params.id)
  if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true, data: item })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const body = await req.json()
  const item = await MenuItem.findByIdAndUpdate(params.id, body, { new: true, runValidators: true })
  if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true, data: item })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  await MenuItem.findByIdAndDelete(params.id)
  return NextResponse.json({ success: true, message: 'Deleted' })
}
