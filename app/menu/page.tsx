'use client'
import { useState, useEffect, useMemo } from 'react'
import { IMenuItem } from '../../lib/types'
import { useCartStore } from '../../store/cart'

const CATEGORIES = ['All', 'Starters', 'Mains', 'Grills', 'Pasta', 'Sides', 'Drinks', 'Desserts']

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)
}

export default function MenuPage() {
  const [items, setItems] = useState<IMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [addedId, setAddedId] = useState<string | null>(null)

  const { addItem, itemCount } = useCartStore()

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch('/api/menu?available=true');
        
        if (!res.ok) {
          throw new Error(`API returned status: ${res.status}`);
        }
        
        const data = await res.json();
        setItems(data.data || []);
      } catch (error) {
        console.error('Failed to fetch menu:', error);
        setItems([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCat = activeCategory === 'All' || item.category === activeCategory
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [items, activeCategory, search])

  const handleAdd = (item: IMenuItem) => {
    addItem(item)
    setAddedId(item._id)
    setTimeout(() => setAddedId(null), 1200)
  }

  return (
    // 🛡️ FIX: Added pt-24 here to clear the main global Navbar
    <div className="min-h-screen bg-stone-950 text-stone-100 pt-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-stone-950/90 backdrop-blur border-b border-stone-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="font-serif text-2xl font-bold text-amber-400">Our Menu</h1>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 w-full sm:max-w-xs bg-stone-800 border border-stone-700 rounded-xl px-4 py-2 text-sm text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
            />

            <a href="/cart" className="relative flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm px-4 py-2 rounded-xl transition-colors">
              🛒 <span className="hidden sm:inline">Cart</span>
              {itemCount() > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {itemCount()}
                </span>
              )}
            </a>
          </div>
        </div>

        {/* Category tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-stone-900 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-stone-500">No items found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div key={item._id} className="group bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 hover:border-amber-500/40 transition-all duration-300">
                {/* Image */}
                <div className="h-48 bg-stone-800 relative overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                  )}
                  {/* Tags */}
                  {item.tags?.length > 0 && (
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="bg-stone-950/80 text-amber-400 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-stone-100">{item.name}</h3>
                    <span className="text-amber-400 font-bold text-sm ml-2 flex-shrink-0">{formatNaira(item.price)}</span>
                  </div>
                  <p className="text-stone-500 text-xs line-clamp-2 mb-4">{item.description}</p>

                  <button
                    onClick={() => handleAdd(item)}
                    className={`w-full py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      addedId === item._id
                        ? 'bg-green-600 text-white scale-95'
                        : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                    }`}
                  >
                    {addedId === item._id ? '✓ Added!' : '+ Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}