/**
 * Run with: npm run seed
 * Seeds the database with initial menu items, tables, and workspace seats.
 */
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-os'

const menuItems = [
  // Starters
  { name: 'Peppersoup', description: 'Rich, spiced Nigerian peppersoup with assorted meat', price: 3500, category: 'Starters', tags: ['spicy', 'popular'], available: true },
  { name: 'Spring Rolls (6 pcs)', description: 'Crispy golden rolls stuffed with veggies and minced meat', price: 2500, category: 'Starters', tags: ['crispy'], available: true },
  { name: 'Chicken Wings', description: 'Tender wings glazed with our signature hot sauce', price: 4000, category: 'Starters', tags: ['spicy', 'popular'], available: true },

  // Mains
  { name: 'Jollof Rice + Chicken', description: 'Party jollof with smoky party chicken and coleslaw', price: 4500, category: 'Mains', tags: ['bestseller', 'popular'], available: true },
  { name: 'Fried Rice + Protein', description: 'Fragrant fried rice with your choice of fish, chicken or beef', price: 4200, category: 'Mains', tags: ['popular'], available: true },
  { name: 'Egusi Soup + Swallow', description: 'Authentic egusi with assorted meat and your choice of swallow', price: 5000, category: 'Mains', tags: ['traditional'], available: true },
  { name: 'Pasta Carbonara', description: 'Classic Roman pasta with pancetta, egg, and parmesan', price: 5500, category: 'Mains', tags: ['western'], available: true },
  { name: 'Grilled Tilapia', description: 'Whole grilled tilapia with peppered sauce and plantain', price: 6500, category: 'Mains', tags: ['seafood', 'grilled'], available: true },

  // Grills
  { name: 'Suya Platter', description: 'Skewered spiced beef suya with raw onion, tomato and yaji', price: 5000, category: 'Grills', tags: ['spicy', 'popular'], available: true },
  { name: 'BBQ Ribs (Half Rack)', description: 'Slow-cooked ribs with our smoky BBQ glaze', price: 9500, category: 'Grills', tags: ['premium'], available: true },

  // Sides
  { name: 'Plantain (Dodo)', description: 'Sweet fried plantain, golden and caramelised', price: 1200, category: 'Sides', tags: ['vegan'], available: true },
  { name: 'Moi Moi', description: 'Steamed bean pudding with eggs and fish', price: 1500, category: 'Sides', tags: ['traditional'], available: true },

  // Drinks
  { name: 'Chapman', description: 'Nigerian favourite: grenadine, lemon, orange, cucumber', price: 1500, category: 'Drinks', tags: ['no-alcohol', 'popular'], available: true },
  { name: 'Fresh Zobo', description: 'House-made hibiscus drink with ginger and pineapple', price: 1000, category: 'Drinks', tags: ['no-alcohol', 'healthy'], available: true },
  { name: 'Bottled Water', description: '75cl chilled water', price: 300, category: 'Drinks', tags: [], available: true },
  { name: 'Malt Drink', description: 'Chilled Nigerian malt', price: 600, category: 'Drinks', tags: [], available: true },

  // Desserts
  { name: 'Puff Puff', description: 'Classic Nigerian sweet fried dough balls (8 pieces)', price: 1200, category: 'Desserts', tags: ['popular'], available: true },
  { name: 'Ice Cream (2 Scoops)', description: 'Creamy vanilla or chocolate, your choice', price: 2000, category: 'Desserts', tags: [], available: true },
]

const restaurantTables = [
  { name: 'T-01', capacity: 2, section: 'restaurant', status: 'free', features: ['window-view'] },
  { name: 'T-02', capacity: 2, section: 'restaurant', status: 'free', features: [] },
  { name: 'T-03', capacity: 4, section: 'restaurant', status: 'free', features: ['window-view'] },
  { name: 'T-04', capacity: 4, section: 'restaurant', status: 'free', features: [] },
  { name: 'T-05', capacity: 4, section: 'restaurant', status: 'free', features: ['outdoor'] },
  { name: 'T-06', capacity: 6, section: 'restaurant', status: 'free', features: [] },
  { name: 'T-07', capacity: 6, section: 'restaurant', status: 'free', features: ['private-area'] },
  { name: 'T-08', capacity: 8, section: 'restaurant', status: 'free', features: ['private-area', 'air-conditioning'] },
  { name: 'T-09', capacity: 10, section: 'restaurant', status: 'free', features: ['private-dining-room'] },
  { name: 'T-10', capacity: 12, section: 'restaurant', status: 'free', features: ['conference-room'] },
]

const workspaceSeats = [
  { name: 'WS-01', capacity: 1, section: 'workspace', status: 'free', features: ['wifi', 'outlet', 'window-view'] },
  { name: 'WS-02', capacity: 1, section: 'workspace', status: 'free', features: ['wifi', 'outlet'] },
  { name: 'WS-03', capacity: 1, section: 'workspace', status: 'free', features: ['wifi', 'outlet'] },
  { name: 'WS-04', capacity: 1, section: 'workspace', status: 'free', features: ['wifi', 'outlet', 'quiet-zone'] },
  { name: 'WS-05', capacity: 1, section: 'workspace', status: 'free', features: ['wifi', 'outlet', 'quiet-zone'] },
  { name: 'WS-06', capacity: 2, section: 'workspace', status: 'free', features: ['wifi', 'outlet', 'standing-desk'] },
  { name: 'WS-POD-A', capacity: 4, section: 'workspace', status: 'free', features: ['wifi', 'outlet', 'meeting-pod', 'tv-screen'] },
]

async function seed() {
  console.log('🌱 Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected')

  const db = mongoose.connection.db!

  // Clear existing
  await db.collection('menuitems').deleteMany({})
  await db.collection('tables').deleteMany({})
  console.log('🗑️  Cleared existing data')

  // Seed menu
  await db.collection('menuitems').insertMany(
    menuItems.map((item) => ({ ...item, createdAt: new Date(), updatedAt: new Date() }))
  )
  console.log(`🍽️  Seeded ${menuItems.length} menu items`)

  // Seed tables
  await db.collection('tables').insertMany([...restaurantTables, ...workspaceSeats])
  console.log(`🪑 Seeded ${restaurantTables.length} restaurant tables + ${workspaceSeats.length} workspace seats`)

  console.log('\n🎉 Seed complete! Run: npm run dev')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
