import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IOrderDocument extends Document {
  orderNumber: string
  items: Array<{
    productId: mongoose.Types.ObjectId
    name: string
    quantity: number
    price: number
  }>
  totalAmount: number
  orderType: 'delivery' | 'pickup' | 'dine-in'
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  customer: {
    name: string
    phone: string
    email?: string
    address?: string
  }
  tableId?: mongoose.Types.ObjectId
  paymentStatus: 'pending' | 'paid' | 'failed'
  paymentMethod: 'cash' | 'bank_transfer' | 'paystack'
  paystackRef?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      unique: true,
      default: () => `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    orderType: {
      type: String,
      enum: ['delivery', 'pickup', 'dine-in'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
      default: 'pending',
    },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      address: { type: String },
    },
    tableId: { type: Schema.Types.ObjectId, ref: 'Table' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'paystack'],
      default: 'cash',
    },
    paystackRef: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
)

OrderSchema.index({ status: 1 })
OrderSchema.index({ orderType: 1 })
OrderSchema.index({ 'customer.phone': 1 })
OrderSchema.index({ createdAt: -1 })

const Order: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema)

export default Order