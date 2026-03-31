import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISettingsDocument extends Document {
  key: string
  // Bank account
  bankName: string
  bankAccountName: string
  bankAccountNumber: string
  bankSortCode?: string
  // Paystack
  paystackPublicKey: string
  
  // 🚚 ADVANCED DELIVERY SETTINGS
  deliveryMode: 'flat' | 'zoned' | 'auto'
  deliveryFee: number // Used for 'flat' mode
  deliveryZones: { name: string; fee: number }[] // Used for 'zoned' mode
  shippingApiKey: string // Used for 'auto' mode (Aggregator)
  freeDeliveryAbove: number
  
  // Restaurant info
  restaurantName: string
  restaurantPhone: string
  restaurantAddress: string
  openingTime: string
  closingTime: string
  // Feature flags
  deliveryEnabled: boolean
  pickupEnabled: boolean
  dineInEnabled: boolean
  workspaceEnabled: boolean
  updatedAt: Date
}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    key: { type: String, required: true, unique: true, default: 'restaurant' },
    // Bank
    bankName: { type: String, default: 'GTBank' },
    bankAccountName: { type: String, default: 'TableOS Restaurant Ltd' },
    bankAccountNumber: { type: String, default: '0123456789' },
    bankSortCode: { type: String, default: '' },
    // Paystack
    paystackPublicKey: { type: String, default: '' },
    
    // 🚚 Delivery
    deliveryMode: { type: String, enum: ['flat', 'zoned', 'auto'], default: 'flat' },
    deliveryFee: { type: Number, default: 1500 },
    deliveryZones: { 
      type: [{ name: String, fee: Number }], 
      default: [
        { name: 'Lagos Island', fee: 1100 },
        { name: 'Lagos Mainland', fee: 1900 },
        { name: 'Ikorodu', fee: 2500 }
      ]
    },
    shippingApiKey: { type: String, default: '' },
    freeDeliveryAbove: { type: Number, default: 10000 },
    
    // Restaurant info
    restaurantName: { type: String, default: 'TableOS Restaurant' },
    restaurantPhone: { type: String, default: '' },
    restaurantAddress: { type: String, default: '' },
    openingTime: { type: String, default: '10:00' },
    closingTime: { type: String, default: '22:00' },
    // Flags
    deliveryEnabled: { type: Boolean, default: true },
    pickupEnabled: { type: Boolean, default: true },
    dineInEnabled: { type: Boolean, default: true },
    workspaceEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const Settings: Model<ISettingsDocument> = mongoose.models.Settings || mongoose.model<ISettingsDocument>('Settings', SettingsSchema)

export default Settings

export async function getSettings(): Promise<ISettingsDocument> {
  let s = await Settings.findOne({ key: 'restaurant' })
  if (!s) {
    s = await Settings.create({ key: 'restaurant' })
  }
  return s
}