'use client'
import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

// 1. We move the actual form into a separate inner component
function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get('callbackUrl') || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
    })

    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else {
      router.push(callbackUrl)
      router.refresh() 
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-amber-400 mb-2">Welcome Back</h1>
          <p className="text-stone-500 text-sm">Sign in to TableOS</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-700 text-red-400 rounded-xl text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Email Address</label>
            <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Password</label>
            <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-500" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 mt-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold rounded-xl transition-colors">
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-stone-500 text-sm mt-6">
          Don't have an account? <a href="/signup" className="text-amber-400 hover:underline">Create one</a>
        </p>
      </div>
    </div>
  )
}

// 2. We wrap the outer page in Suspense to make Vercel happy!
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950 flex items-center justify-center text-amber-400">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
