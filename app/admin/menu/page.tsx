'use client'
import { useState, useEffect } from 'react'
import { IMenuItem } from '../../../lib/types'

function formatNaira(n: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)
}

const CATEGORIES = ['Starters', 'Mains', 'Grills', 'Pasta', 'Sides', 'Drinks', 'Desserts']

const EMPTY_FORM = { name: '', description: '', price: '', category: 'Mains', tags: '', image: '' }

export default function AdminMenuPage() {
  const [items, setItems] = useState<IMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<IMenuItem | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchItems = async () => {
    const res = await fetch('/api/menu')
    const data = await res.json()
    if (data.success) setItems(data.data)
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true) }
  const openEdit = (item: IMenuItem) => {
    setEditing(item)
    setForm({ name: item.name, description: item.description, price: String(item.price), category: item.category, tags: item.tags?.join(', ') || '', image: item.image || '' })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name || !form.price || !form.category) return alert('Fill required fields')
    setSaving(true)
    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      category: form.category,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      image: form.image || undefined,
    }

    const url = editing ? `/api/menu/${editing._id}` : '/api/menu'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()

    if (data.success) {
      fetchItems()
      setShowForm(false)
    } else {
      alert(data.error || 'Save failed')
    }
    setSaving(false)
  }

  const toggleAvailable = async (item: IMenuItem) => {
    await fetch(`/api/menu/${item._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, available: !item.available }),
    })
    fetchItems()
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return
    await fetch(`/api/menu/${id}`, { method: 'DELETE' })
    fetchItems()
  }

  // Group by category
  const grouped: Record<string, IMenuItem[]> = {}
  items.forEach((i) => {
    if (!grouped[i.category]) grouped[i.category] = []
    grouped[i.category].push(i)
  })

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <a href="/admin" className="text-stone-500 hover:text-stone-300 text-sm">← Dashboard</a>
            <h1 className="font-serif text-2xl font-bold text-amber-400 mt-1">Menu Manager</h1>
          </div>
          <button onClick={openCreate}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl transition-colors">
            + Add Item
          </button>
        </div>

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-stone-950/90 backdrop-blur z-50 flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-700 rounded-2xl p-6 w-full max-w-md space-y-4">
              <h2 className="font-serif text-xl font-bold text-amber-400">{editing ? 'Edit Item' : 'New Menu Item'}</h2>

              <input placeholder="Item Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500" />

              <textarea placeholder="Description *" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 resize-none" />

              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Price (₦) *" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500" />
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-200 focus:outline-none">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <input placeholder="Tags (comma-separated): vegan, spicy, new" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500" />

              <input placeholder="Image URL (Cloudinary)" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500" />

              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-stone-800 text-stone-300 rounded-xl hover:bg-stone-700 transition-colors">Cancel</button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-bold rounded-xl transition-colors">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-stone-500">Loading menu...</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([category, catItems]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">{category} ({catItems.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {catItems.map((item) => (
                    <div key={item._id} className={`bg-stone-900 rounded-xl border p-4 flex gap-4 transition-all ${item.available ? 'border-stone-800' : 'border-stone-800 opacity-50'}`}>
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-stone-100 truncate">{item.name}</p>
                          <span className="text-amber-400 font-bold text-sm ml-2 flex-shrink-0">{formatNaira(item.price)}</span>
                        </div>
                        <p className="text-stone-500 text-xs line-clamp-1 mb-2">{item.description}</p>
                        {item.tags?.length > 0 && (
                          <div className="flex gap-1 mb-2 flex-wrap">
                            {item.tags.map((tag) => (
                              <span key={tag} className="bg-stone-700 text-stone-400 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button onClick={() => toggleAvailable(item)}
                            className={`text-xs px-2 py-0.5 rounded-lg transition-colors ${item.available ? 'bg-green-900/30 text-green-400 hover:bg-red-900/30 hover:text-red-400' : 'bg-red-900/30 text-red-400 hover:bg-green-900/30 hover:text-green-400'}`}>
                            {item.available ? '✓ Available' : '✕ Hidden'}
                          </button>
                          <button onClick={() => openEdit(item)} className="text-xs px-2 py-0.5 bg-stone-700 text-stone-300 rounded-lg hover:bg-stone-600 transition-colors">Edit</button>
                          <button onClick={() => deleteItem(item._id)} className="text-xs px-2 py-0.5 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}