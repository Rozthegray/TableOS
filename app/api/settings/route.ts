import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Settings, { getSettings } from '@/models/Settings' // Adjust path to your models folder if needed

export async function GET() {
  try {
    await dbConnect()
    const settings = await getSettings()
    return NextResponse.json({ success: true, data: settings })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect()
    const body = await req.json()
    
    // Find the single settings document and update it
    const settings = await Settings.findOneAndUpdate(
      { key: 'restaurant' },
      { $set: body },
      { new: true, upsert: true }
    )
    
    return NextResponse.json({ success: true, data: settings })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}