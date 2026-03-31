import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar' // <-- Import the new navbar
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'TableOS — Restaurant, Café & Workspace',
  description: 'Order food, reserve tables, book workspaces — all in one platform.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      {/* Ensure the body has the dark background default so it matches your theme */}
      <body className="font-sora antialiased bg-stone-950 text-stone-100 min-h-screen">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}