// ── ORDER ──────────────────────────────────────────────────────────────────
export type OrderType = 'delivery' | 'pickup' | 'dine-in'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'paystack'

export interface OrderItem {
  productId: string
  name: string
  quantity: number
  price: number
}

export interface CustomerInfo {
  name: string
  phone: string
  email?: string
  address?: string
}

export interface IOrder {
  _id: string
  orderNumber: string
  items: OrderItem[]
  totalAmount: number
  orderType: OrderType
  status: OrderStatus
  customer: CustomerInfo
  tableId?: string
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  paystackRef?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// ── MENU ITEM ──────────────────────────────────────────────────────────────
export interface IMenuItem {
  _id: string
  name: string
  description: string
  price: number
  category: string
  image?: string
  available: boolean
  tags: string[]
  createdAt: string
}

// ── TABLE ──────────────────────────────────────────────────────────────────
export type TableSection = 'restaurant' | 'workspace'
export type TableStatus = 'free' | 'reserved' | 'occupied'

export interface ITable {
  _id: string
  name: string
  capacity: number
  section: TableSection
  status: TableStatus
  features: string[]
}

// ── RESERVATION ────────────────────────────────────────────────────────────
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'seated' | 'completed'

export interface IReservation {
  _id: string
  tableId: string
  table?: ITable
  customer: CustomerInfo
  date: string
  timeSlot: string
  guests: number
  status: ReservationStatus
  notes?: string
  createdAt: string
}

// ── WORKSPACE ──────────────────────────────────────────────────────────────
export type WorkspacePlan = 'daily' | 'monthly'
export type WorkspaceStatus = 'pending' | 'active' | 'expired' | 'cancelled'

export interface IWorkspaceBooking {
  _id: string
  seatId: string
  seat?: ITable
  user: CustomerInfo
  plan: WorkspacePlan
  date: string
  endDate?: string
  amount: number
  status: WorkspaceStatus
  paystackRef?: string
  createdAt: string
}

// ── DELIVERY ───────────────────────────────────────────────────────────────
export type DeliveryStatus = 'assigned' | 'on_the_way' | 'delivered' | 'failed'

export interface IRider {
  name: string
  phone: string
}

export interface IDelivery {
  _id: string
  orderId: string
  order?: IOrder
  rider?: IRider
  address: string
  status: DeliveryStatus
  estimatedTime?: number
  createdAt: string
}

// ── CART ───────────────────────────────────────────────────────────────────
export interface CartItem {
  product: IMenuItem
  quantity: number
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────
export interface DashboardStats {
  todayOrders: number
  pendingOrders: number
  todayRevenue: number
  activeReservations: number
  activeWorkspaceBookings: number
  weeklyRevenue: number[]
}