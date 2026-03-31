import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'
import { Reservation, WorkspaceBooking } from '@/models'

export async function GET() {
  await dbConnect()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  // Today's stats
  const [
    todayOrders,
    pendingOrders,
    todayRevenueAgg,
    activeReservations,
    activeWorkspaceBookings,
  ] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: today, $lte: todayEnd } }),
    Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing'] } }),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lte: todayEnd },
          paymentStatus: 'paid',
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Reservation.countDocuments({
      date: { $gte: today, $lte: todayEnd },
      status: { $in: ['confirmed', 'seated'] },
    }),
    WorkspaceBooking.countDocuments({ status: 'active' }),
  ])

  // Weekly revenue (last 7 days)
  const weeklyRevenue: number[] = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date()
    dayStart.setDate(dayStart.getDate() - i)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)

    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dayStart, $lte: dayEnd },
          paymentStatus: 'paid',
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ])
    weeklyRevenue.push(result[0]?.total || 0)
  }

  // Recent orders (last 10)
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('orderNumber customer status orderType totalAmount createdAt')

  return NextResponse.json({
    success: true,
    data: {
      todayOrders,
      pendingOrders,
      todayRevenue: todayRevenueAgg[0]?.total || 0,
      activeReservations,
      activeWorkspaceBookings,
      weeklyRevenue,
      recentOrders,
    },
  })
}
