export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query) return NextResponse.json([])

  // 🔐 Paste your new LocationIQ API Token here
  const LOCATIONIQ_TOKEN = "pk.e8a53d78d464bb5fa0e0bd99ca570021"

  try {
    // 🌍 Pinging LocationIQ's enterprise servers instead of the free public ones
    const res = await fetch(`https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_TOKEN}&format=json&countrycodes=ng&q=${encodeURIComponent(query)}`)
    
    const data = await res.json()
    
    // LocationIQ returns an explicit error object if a street doesn't exist, 
    // whereas Nominatim returns an empty array. We handle that here so the frontend doesn't crash!
    if (data.error) {
       return NextResponse.json([]) 
    }

    return NextResponse.json(data)
    
  } catch (error) {
    console.error("Backend Map Error:", error)
    return NextResponse.json({ error: 'Map API failed' }, { status: 500 })
  }
}