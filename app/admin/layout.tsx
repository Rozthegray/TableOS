'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Calendar, 
  Laptop, 
  Utensils, 
  ShoppingBag, 
  Settings,
  Menu, 
  X, 
  LogOut 
} from 'lucide-react'

// Define the admin navigation links
const NAV_LINKS = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Reservations', href: '/admin/reservations', icon: Calendar },
  { name: 'Workspace', href: '/admin/workspace', icon: Laptop },
  { name: 'Menu Editor', href: '/admin/menu', icon: Utensils },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile sidebar whenever the route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-stone-950 font-sans flex">
      
      {/* 📱 MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-stone-900 border-b border-stone-800 z-40 flex items-center justify-between px-4">
        <div className="font-serif text-xl font-bold text-amber-400">TableOS <span className="text-stone-500 text-sm font-sans font-normal">Admin</span></div>
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="text-stone-300 hover:text-white transition-colors"
        >
          <Menu size={28} />
        </button>
      </div>

      {/* 🌑 MOBILE BACKDROP */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 🗄️ SIDEBAR */}
      <aside 
        className={`fixed top-0 left-0 h-full w-64 bg-stone-900 border-r border-stone-800 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-stone-800">
          <div className="font-serif text-2xl font-bold text-amber-400">TableOS</div>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-stone-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href

            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-amber-500/10 text-amber-400 font-semibold' 
                    : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-amber-400' : 'text-stone-500'} />
                {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-stone-800">
          <Link 
            href="/"
            className="flex items-center gap-3 px-3 py-3 text-stone-400 hover:bg-stone-800 hover:text-white rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span>Exit Admin</span>
          </Link>
        </div>
      </aside>

      {/* 🖥️ MAIN CONTENT AREA */}
      <main className="flex-1 w-full md:pl-64 pt-16 md:pt-0">
        <div className="h-full w-full">
          {children}
        </div>
      </main>

    </div>
  )
}