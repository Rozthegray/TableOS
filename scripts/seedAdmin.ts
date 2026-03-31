import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

// Load your .env.local variables so we can connect to your DB
dotenv.config({ path: '.env.local' })

async function seedAdmin() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing in .env.local')
    process.exit(1)
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI)
    
    const UserSchema = new mongoose.Schema({
      name: String, email: String, password: { type: String, select: false }, role: String
    })
    const User = mongoose.models.User || mongoose.model('User', UserSchema)

    const existingAdmin = await User.findOne({ email: 'admin@tableos.com' })
    if (existingAdmin) {
      console.log('⚠️ Admin already exists! You can log in.')
      process.exit(0)
    }

    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    await User.create({
      name: 'Super Admin',
      email: 'admin@tableos.com',
      password: hashedPassword,
      role: 'admin' // 👑 Master key
    })

    console.log('✅ Admin user created successfully! (admin@tableos.com / admin123)')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seedAdmin()