import mongoose, { Schema, Document, Model } from 'mongoose'

// ── TABLE ──────────────────────────────────────────────────────────────────
export interface ITableDocument extends Document {
  name: string
  capacity: number
  section: 'restaurant' | 'workspace'
  status: 'free' | 'reserved' | 'occupied'
  features: string[]
}

const TableSchema = new Schema<ITableDocument>({
  name: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  section: { type: String, enum: ['restaurant', 'workspace'], required: true },
  status: { type: String, enum: ['free', 'reserved', 'occupied'], default: 'free' },
  features: [{ type: String }],
})

export const Table: Model<ITableDocument> =
  mongoose.models.Table || mongoose.model<ITableDocument>('Table', TableSchema)

// ── RESERVATION ────────────────────────────────────────────────────────────
export interface IReservationDocument extends Document {
  tableId: mongoose.Types.ObjectId
  customer: { name: string; phone: string; email?: string }
  date: Date
  timeSlot: string
  guests: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'seated' | 'completed'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const ReservationSchema = new Schema<IReservationDocument>(
  {
    tableId: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
    },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    guests: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'seated', 'completed'],
      default: 'pending',
    },
    notes: { type: String },
  },
  { timestamps: true }
)

ReservationSchema.index({ date: 1, timeSlot: 1 })
ReservationSchema.index({ tableId: 1, date: 1 })
ReservationSchema.index({ status: 1 })

export const Reservation: Model<IReservationDocument> =
  mongoose.models.Reservation ||
  mongoose.model<IReservationDocument>('Reservation', ReservationSchema)

// ── WORKSPACE BOOKING ──────────────────────────────────────────────────────
export interface IWorkspaceBookingDocument extends Document {
  seatId: mongoose.Types.ObjectId
  user: { name: string; phone: string; email?: string }
  plan: 'daily' | 'monthly'
  date: Date
  endDate?: Date
  amount: number
  status: 'pending' | 'active' | 'expired' | 'cancelled'
  paystackRef?: string
  createdAt: Date
  updatedAt: Date
}

const WorkspaceBookingSchema = new Schema<IWorkspaceBookingDocument>(
  {
    seatId: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
    user: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
    },
    plan: { type: String, enum: ['daily', 'monthly'], required: true },
    date: { type: Date, required: true },
    endDate: { type: Date },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'cancelled'],
      default: 'pending',
    },
    paystackRef: { type: String },
  },
  { timestamps: true }
)

WorkspaceBookingSchema.index({ date: 1, seatId: 1 })
WorkspaceBookingSchema.index({ status: 1 })

export const WorkspaceBooking: Model<IWorkspaceBookingDocument> =
  mongoose.models.WorkspaceBooking ||
  mongoose.model<IWorkspaceBookingDocument>('WorkspaceBooking', WorkspaceBookingSchema)

// ── DELIVERY ───────────────────────────────────────────────────────────────
export interface IDeliveryDocument extends Document {
  orderId: mongoose.Types.ObjectId
  rider?: { name: string; phone: string }
  address: string
  status: 'assigned' | 'on_the_way' | 'delivered' | 'failed'
  estimatedTime?: number
  createdAt: Date
  updatedAt: Date
}

const DeliverySchema = new Schema<IDeliveryDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    rider: {
      name: { type: String },
      phone: { type: String },
    },
    address: { type: String, required: true },
    status: {
      type: String,
      enum: ['assigned', 'on_the_way', 'delivered', 'failed'],
      default: 'assigned',
    },
    estimatedTime: { type: Number },
  },
  { timestamps: true }
)

export const Delivery: Model<IDeliveryDocument> =
  mongoose.models.Delivery || mongoose.model<IDeliveryDocument>('Delivery', DeliverySchema)