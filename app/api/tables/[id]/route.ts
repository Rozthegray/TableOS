import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Table } from '@/models'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const table = await Table.findById(params.id)
  if (!table) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true, data: table })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const body = await req.json()
  const table = await Table.findByIdAndUpdate(params.id, body, { new: true })
  if (!table) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true, data: table })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  await Table.findByIdAndDelete(params.id)
  return NextResponse.json({ success: true })
}
