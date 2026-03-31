import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IMenuItemDocument extends Document {
  name: string
  description: string
  price: number
  category: string
  image?: string
  available: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const MenuItemSchema = new Schema<IMenuItemDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    image: { type: String },
    available: { type: Boolean, default: true },
    tags: [{ type: String }],
  },
  { timestamps: true }
)

MenuItemSchema.index({ category: 1 })
MenuItemSchema.index({ available: 1 })
MenuItemSchema.index({ name: 'text', description: 'text' })

const MenuItem: Model<IMenuItemDocument> =
  mongoose.models.MenuItem || mongoose.model<IMenuItemDocument>('MenuItem', MenuItemSchema)

export default MenuItem