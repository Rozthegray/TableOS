import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Table } from '@/models'

export async function GET(req: NextRequest) {
  await dbConnect()
  const { searchParams } = new URL(req.url)
  const section = searchParams.get('section')
  const status = searchParams.get('status')

  const filter: Record<string, unknown> = {}
  if (section) filter.section = section
  if (status) filter.status = status

  const tables = await Table.find(filter).sort({ name: 1 })
  return NextResponse.json({ success: true, data: tables })
}

export async function POST(req: NextRequest) {
  await dbConnect()
  const body = await req.json()
  try {
    const table = await Table.create(body)
    return NextResponse.json({ success: true, data: table }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
