import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import MenuItem from '@/models/MenuItem'

// GET /api/menu — list all menu items (optionally filter by category)
export async function GET(req: NextRequest) {
  await dbConnect()
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const available = searchParams.get('available')

  const filter: Record<string, unknown> = {}
  if (category) filter.category = category
  if (available !== null) filter.available = available === 'true'

  const items = await MenuItem.find(filter).sort({ category: 1, name: 1 })
  return NextResponse.json({ success: true, data: items })
}

// POST /api/menu — create new menu item (admin only)
export async function POST(req: NextRequest) {
  await dbConnect()
  const body = await req.json()

  try {
    const item = await MenuItem.create(body)
    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
