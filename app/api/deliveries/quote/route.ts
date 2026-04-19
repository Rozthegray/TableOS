export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { getSettings } from '@/models/Settings'

// 🧮 Haversine Formula for exact GPS distance calculation
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { customerLat, customerLng } = await req.json();

    if (!customerLat || !customerLng) {
      return NextResponse.json({ success: false, error: 'Valid map coordinates are required.' }, { status: 400 });
    }

    const settings = await getSettings();

    // 1. Parse your restaurant's GPS and the customer's GPS
    const originLat = parseFloat(settings.restaurantLat || "6.427018");
    const originLng = parseFloat(settings.restaurantLng || "3.41859");
    const destLat = parseFloat(customerLat);
    const destLng = parseFloat(customerLng);

    // 2. Calculate the exact Geographic Distance
    const distanceInKm = getDistanceFromLatLonInKm(originLat, originLng, destLat, destLng);
    
    // 3. ⚖️ AT-COST LAGOS LOGISTICS ALGORITHM (Zero TableOS Markup)
    // Most Lagos dispatch networks charge ~₦1,500 for the first 3km, and ~₦200 per extra km.
    let calculatedFee = 1500; 
    
    if (distanceInKm > 3) {
      const extraKm = Math.ceil(distanceInKm - 3);
      calculatedFee += (extraKm * 200); 
    }

    // Clean rounding to the nearest hundred for the payment gateway
    calculatedFee = Math.ceil(calculatedFee / 100) * 100;

    console.log(`🗺️ At-Cost Routing: Distance ${distanceInKm.toFixed(2)}km. Fee: ₦${calculatedFee}`);

    // Return the instant quote to the frontend!
    return NextResponse.json({ 
      success: true, 
      deliveryFee: calculatedFee,
      distance: distanceInKm.toFixed(2)
    });

  } catch (error: any) {
    console.error("🔥 LOCAL ROUTING ERROR:", error.message);
    return NextResponse.json({ success: false, error: "Could not calculate distance." }, { status: 500 });
  }
}