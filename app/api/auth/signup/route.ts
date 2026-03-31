import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/db'
import User from '@/models/User' // Adjust path if needed

export async function POST(req: Request) {
  try {
    await dbConnect()
    const { name, email, password, phone } = await req.json()

    // Check if they already have an account
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 })
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the customer
    await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'customer' // 👤 Normal user
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}