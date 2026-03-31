import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-stone-950/80 backdrop-blur border-b border-stone-800 px-6 py-4 flex justify-between items-center">
        <span className="font-serif text-xl font-bold text-amber-400">TableOS</span>
        <div className="flex gap-4 text-sm">
          <Link href="/menu" className="text-stone-400 hover:text-stone-100 transition-colors">Menu</Link>
          <Link href="/reservations" className="text-stone-400 hover:text-stone-100 transition-colors">Reserve</Link>
          <Link href="/workspace" className="text-stone-400 hover:text-stone-100 transition-colors">Workspace</Link>
          <Link href="/cart" className="bg-amber-500 text-stone-950 font-semibold px-4 py-1.5 rounded-lg hover:bg-amber-400 transition-colors">Order Now</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-20 min-h-screen flex flex-col justify-center px-6" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% -10%, #2d1b0e, #0a0a0a)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-8">
            Restaurant + Café + Workspace
          </div>
          <h1 className="font-serif text-6xl sm:text-8xl font-black leading-none mb-6" style={{ letterSpacing: '-0.02em' }}>
            Dine.<br />
            <span className="text-amber-400 italic">Work.</span><br />
            Belong.
          </h1>
          <p className="text-stone-400 text-xl max-w-lg mx-auto mb-10 leading-relaxed">
            The best food in town, a table always ready for you, and a workspace where productivity flows.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/menu" className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-lg rounded-xl transition-all hover:scale-105">
              Order Food 🍔
            </Link>
            <Link href="/workspace" className="px-8 py-4 bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold text-lg rounded-xl transition-all border border-stone-700">
              Book Workspace 💻
            </Link>
          </div>
        </div>
      </div>

      {/* Service cards */}
      <div className="max-w-5xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { href: '/menu', icon: '🍽️', title: 'Order Food', desc: 'Delivery, pickup, or dine-in. Fresh food crafted with love, straight to you.', cta: 'Browse Menu' },
          { href: '/reservations', icon: '🪑', title: 'Reserve a Table', desc: 'Book your spot for tonight or next week. Auto-assigned, instantly confirmed.', cta: 'Book a Table' },
          { href: '/workspace', icon: '💻', title: 'Work Here', desc: 'Fast WiFi, great coffee, and the vibe that gets you into flow state fast.', cta: 'See Plans' },
        ].map((card) => (
          <Link key={card.href} href={card.href}
            className="group bg-stone-900 border border-stone-800 rounded-2xl p-6 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1">
            <div className="text-4xl mb-4">{card.icon}</div>
            <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors">{card.title}</h3>
            <p className="text-stone-500 text-sm leading-relaxed mb-4">{card.desc}</p>
            <span className="text-amber-400 text-sm font-medium group-hover:underline">{card.cta} →</span>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-800 px-6 py-8 text-center text-stone-600 text-sm">
        <p>TableOS — Built with Next.js + MongoDB</p>
      </footer>
    </div>
  )
}
