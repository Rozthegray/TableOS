import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#11100E] text-[#F3EFEA] font-sans selection:bg-[#D4A373] selection:text-[#11100E] relative">
      
      {/* 🌟 THE CAFE BACKGROUND IMAGE
        Increased opacity to 60% so the cafe's beautiful warm lighting pops!
      */}
      <div className="fixed inset-0 z-0 bg-[url('/cafe.png')] bg-cover bg-center bg-no-repeat opacity-60"></div>
      
      {/* 🌤️ Softened Gradient Overlay 
          Much lighter at the top (/20) so the image is visible, fading to dark at the bottom for readability 
      */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#11100E]/20 via-[#11100E]/60 to-[#11100E]/95"></div>

      {/* Nav */}
      <nav className="relative z-50 border-b border-[#2C2822]/50 px-6 py-5 flex justify-between items-center bg-[#11100E]/40 backdrop-blur-lg">
        <div className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold tracking-tight text-[#D4A373]">TableOS</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-[#A09D96]">
          <Link href="#features" className="hover:text-[#F3EFEA] transition-colors">Features</Link>
          <Link href="#why-us" className="hover:text-[#F3EFEA] transition-colors">Why TableOS</Link>
          <Link href="/menu" className="hover:text-[#F3EFEA] transition-colors">View Demo</Link>
        </div>
        <div className="flex gap-4">
          <Link href="/admin" className="text-sm font-bold text-[#F3EFEA] border border-[#2C2822] hover:border-[#D4A373]/50 px-5 py-2.5 rounded-full transition-all bg-[#11100E]/50 backdrop-blur-md">
            Admin Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center min-h-[85vh]">
        <div className="inline-flex items-center gap-2 bg-[#11100E]/60 backdrop-blur-md border border-[#D4A373]/30 text-[#D4A373] text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-8 shadow-2xl">
          <span className="w-2 h-2 rounded-full bg-[#D4A373] animate-pulse"></span>
          Take Back Your Revenue
        </div>
        
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-medium leading-[1.05] mb-8 max-w-5xl tracking-tight text-[#F3EFEA] drop-shadow-2xl">
          Your Restaurant.<br />
          <span className="italic text-[#D4A373]">Your Rules.</span><br />
          Zero Commissions.
        </h1>
        
        <p className="text-[#E8E6E1] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light drop-shadow-md">
          Stop losing 25% to big delivery apps. We set up your digital menu, 
          reservation system, workspace booking, and automated delivery—giving you 
          100% control of your business.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/menu" className="w-full sm:w-auto px-8 py-4 bg-[#D4A373] hover:bg-[#E2B78C] text-[#11100E] font-bold text-base rounded-full transition-all hover:scale-105 shadow-[0_0_40px_-10px_#D4A373]">
            Explore the Demo Store
          </Link>
          <Link href="/admin" className="w-full sm:w-auto px-8 py-4 bg-[#11100E]/60 backdrop-blur-md hover:bg-[#221F1B] text-[#F3EFEA] font-semibold text-base rounded-full transition-all border border-[#D4A373]/30 hover:border-[#D4A373]/60">
            View Admin Dashboard
          </Link>
        </div>
      </div>

      {/* The Pain Point / Solution Section */}
      <div id="why-us" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="bg-[#11100E]/80 backdrop-blur-xl border border-[#2C2822] rounded-3xl p-8 md:p-12 lg:p-16 flex flex-col md:flex-row gap-12 items-center overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-900/10 rounded-full blur-[80px]"></div>
          
          <div className="flex-1 space-y-6">
            <h2 className="font-serif text-3xl md:text-5xl font-medium text-[#F3EFEA]">
              The <span className="text-red-400 italic">25% Tax</span> on your hard work ends today.
            </h2>
            <p className="text-[#A09D96] text-lg leading-relaxed">
              Big brands like Chowdeck and Glovo force you to raise prices or eat the cost. 
              TableOS is your own white-labeled operating system. You get direct Paystack payments, 
              and we pass the exact Fez Delivery fee straight to the customer. 
              <strong className="text-[#F3EFEA] font-medium ml-1">You keep 100% of your food sales.</strong>
            </p>
          </div>

          <div className="w-full md:w-1/3 bg-[#1A1815]/70 backdrop-blur-md border border-[#2C2822] rounded-2xl p-6 shadow-2xl relative z-10">
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-[#A09D96] border-b border-[#2C2822] pb-3">
                <span>Food Order</span>
                <span>₦10,000</span>
              </div>
              <div className="flex justify-between text-sm text-red-400 border-b border-[#2C2822] pb-3">
                <span>Big App Commission (25%)</span>
                <span>- ₦2,500</span>
              </div>
              <div className="flex justify-between text-sm text-[#87966A] border-b border-[#2C2822] pb-3">
                <span>TableOS Commission</span>
                <span>- ₦0</span>
              </div>
              <div className="flex justify-between font-serif text-xl text-[#D4A373] pt-2">
                <span>You Keep</span>
                <span>₦10,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4 text-[#F3EFEA]">Everything in one place.</h2>
          <p className="text-[#A09D96] text-lg max-w-2xl mx-auto">We map out your physical space and turn it into a digital revenue engine.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { 
              icon: '🏍️', 
              title: 'Automated Delivery', 
              desc: 'Seamlessly integrated with Fez Delivery & LocationIQ. Accurate GPS routing, at-cost pricing, and automated rider dispatch the moment a user pays.' 
            },
            { 
              icon: '💳', 
              title: 'Direct Payments', 
              desc: 'Integrated with Paystack. Money flows directly into your bank account. No waiting for weekly payouts from third-party apps.' 
            },
            { 
              icon: '🪑', 
              title: 'Smart Reservations', 
              desc: 'A visual map of your restaurant. Customers book specific tables, and the system automatically manages availability to prevent double-booking.' 
            },
            { 
              icon: '💻', 
              title: 'Workspace Booking', 
              desc: 'Monetize your empty seats during the day. Let remote workers book desks, buy Wi-Fi passes, and order coffee directly to their seat.' 
            },
            { 
              icon: '📱', 
              title: 'Live Tracking', 
              desc: 'Uber-style order tracking. Customers get SMS alerts and a beautiful live-updating page showing exactly when their food will arrive.' 
            },
            { 
              icon: '📊', 
              title: 'Total Admin Control', 
              desc: 'A powerful dashboard to manage your menu, toggle availability, update store settings, and watch your orders drop in real-time.' 
            },
          ].map((feature, i) => (
            <div key={i} className="group bg-[#11100E]/70 backdrop-blur-md border border-[#2C2822] rounded-3xl p-8 hover:bg-[#1A1815]/90 hover:border-[#D4A373]/30 transition-all duration-500 shadow-xl">
              <div className="text-4xl mb-6 p-4 bg-[#1A1815]/80 inline-block rounded-2xl border border-[#2C2822] group-hover:scale-110 transition-transform duration-500 shadow-inner">{feature.icon}</div>
              <h3 className="font-serif text-xl font-medium mb-3 text-[#F3EFEA] group-hover:text-[#D4A373] transition-colors">{feature.title}</h3>
              <p className="text-[#A09D96] text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative z-10 border-t border-[#2C2822] mt-12 bg-[#11100E]/95 backdrop-blur-3xl">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-medium mb-6 text-[#F3EFEA]">Ready to own your audience?</h2>
          <p className="text-[#A09D96] text-lg mb-10 max-w-xl mx-auto">
            Stop renting your customers from delivery apps. Build your brand, own your data, and keep your profit.
          </p>
          <Link href="/admin" className="inline-block px-10 py-5 bg-[#D4A373] hover:bg-[#E2B78C] text-[#11100E] font-bold text-lg rounded-full transition-all hover:scale-105 shadow-xl">
            Start Your Restaurant OS
          </Link>
        </div>
        
        <div className="border-t border-[#2C2822] px-6 py-8 text-center text-[#67635D] text-sm flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto">
          <p>© 2026 TableOS. Built for Lagos.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-[#D4A373] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#D4A373] transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </div>
  )
}