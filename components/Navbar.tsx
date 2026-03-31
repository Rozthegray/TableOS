'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ShoppingBag } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useCartStore } from '../store/cart' // Adjust path to your cart store if needed
import CartSidebar from './CartSidebar' // Adjust path to your CartSidebar if needed

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const pathname = usePathname()
  
  // Auth & Cart State
  const { data: session, status } = useSession()
  const itemCount = useCartStore((state) => state.itemCount)
  const [mounted, setMounted] = useState(false)

  // Hydration fix for Zustand
  useEffect(() => setMounted(true), [])

  // 🛡️ Hide this customer navbar if we are inside the Admin panel
  if (pathname?.startsWith('/admin')) {
    return null
  }

  const navLinks = [
    { name: 'Menu', href: '/menu' },
    { name: 'Reserve', href: '/reservations' },
    { name: 'Workspace', href: '/workspace' },
  ]

  return (
    <>
      <nav className="absolute top-0 w-full z-50 bg-transparent text-stone-100 border-b border-stone-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <Link href="/" className="font-serif text-2xl font-bold text-amber-400 tracking-tight">
              TableOS
            </Link>

            {/* Desktop Nav (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className="text-sm font-medium hover:text-amber-400 transition-colors"
                >
                  {link.name}
                </Link>
              ))}

              {/* 🔐 Authentication Block */}
              <div className="flex items-center gap-4 pl-4 border-l border-stone-700">
                {status === 'authenticated' ? (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-stone-400">
                      Hi, {session.user?.name?.split(' ')[0]}
                    </span>
                    {/* Only show Dashboard link to Admins */}
                    {(session.user as any)?.role === 'admin' && (
                      <Link href="/admin" className="text-amber-400 hover:text-amber-300 text-sm font-bold">
                        Dashboard
                      </Link>
                    )}
                    <button onClick={() => signOut()} className="text-sm text-stone-500 hover:text-stone-300">
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="text-sm font-semibold text-stone-300 hover:text-amber-400 transition-colors">
                    Sign In
                  </Link>
                )}
              </div>

              {/* 🛒 Cart Button */}
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative text-stone-300 hover:text-amber-400 transition-colors"
              >
                <ShoppingBag size={24} />
                {mounted && itemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-stone-950 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {itemCount()}
                  </span>
                )}
              </button>

              <Link 
                href="/menu" 
                className="bg-amber-500 text-stone-950 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              >
                Order Now
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="md:hidden flex items-center gap-4">
              {/* Mobile Cart Icon */}
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative text-stone-300 hover:text-amber-400 transition-colors"
              >
                <ShoppingBag size={24} />
                {mounted && itemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-stone-950 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {itemCount()}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="text-stone-300 hover:text-amber-400 transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {isOpen && (
          <div className="md:hidden bg-stone-950 border-b border-stone-800 absolute w-full shadow-2xl">
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-stone-300 hover:text-amber-400 hover:bg-stone-900 rounded-xl transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              
              {/* Mobile Auth Block */}
              <div className="border-t border-stone-800 pt-2 mt-2">
                {status === 'authenticated' ? (
                  <>
                    <div className="px-4 py-2 text-sm text-stone-400">
                      Logged in as {session.user?.name}
                    </div>
                    {(session.user as any)?.role === 'admin' && (
                      <Link href="/admin" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-base font-medium text-amber-400 hover:bg-stone-900 rounded-xl">
                        Admin Dashboard
                      </Link>
                    )}
                    <button onClick={() => { signOut(); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-base font-medium text-stone-400 hover:text-stone-300 hover:bg-stone-900 rounded-xl">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-base font-medium text-stone-300 hover:text-amber-400 hover:bg-stone-900 rounded-xl">
                    Sign In
                  </Link>
                )}
              </div>

              <div className="pt-4 px-2">
                <Link 
                  href="/menu" 
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center bg-amber-500 text-stone-950 px-5 py-3.5 rounded-xl text-base font-bold hover:bg-amber-400 transition-colors"
                >
                  Order Now
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Slide-out Cart */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}