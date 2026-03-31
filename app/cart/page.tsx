'use client'

import dynamic from 'next/dynamic'

// This forces Next.js to ONLY load the checkout page in the browser, bypassing the SSR "window" crash!
const CartContent = dynamic(() => import('./CartContent'), { ssr: false })

export default function CartPage() {
  return <CartContent />
}