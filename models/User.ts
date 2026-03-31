import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUserDocument extends Document {
  name: string
  email: string
  password?: string
  phone?: string
  role: 'customer' | 'admin'
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false }, // Don't return password by default
    phone: { type: String },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  },
  { timestamps: true }
)

const User: Model<IUserDocument> = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema)

export default User