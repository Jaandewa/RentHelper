'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Tag, Package, Info } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  sortOrder: number
  _count: { items: number }
}

const COLOR_PALETTE = [
  { bg: '#EFF6FF', color: '#1D4ED8' },
  { bg: '#F5F3FF', color: '#6D28D9' },
  { bg: '#FFFBEB', color: '#B45309' },
  { bg: '#F0FDF4', color: '#15803D' },
  { bg: '#FFF1F2', color: '#BE123C' },
  { bg: '#EEF2FF', color: '#4338CA' },
  { bg: '#FDF4FF', color: '#7E22CE' },
  { bg: '#F0FDFA', color: '#0F766E' },
  { bg: '#FFF7ED', color: '#C2410C' },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => {
        setCategories(d.categories || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Loading categories...</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Global item categories managed by admin · {categories.length} categories available
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Categories are managed by admin. Use these when adding items.</span>
        </div>
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-500">No categories yet</h3>
          <p className="text-sm text-gray-400 mt-1">
            Your admin hasn't added any categories yet. Contact your admin to set up categories.
          </p>
        </div>
      )}

      {/* Categories Grid */}
      {categories.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, idx) => {
            const palette = COLOR_PALETTE[idx % COLOR_PALETTE.length]
            const myItems = cat._count?.items ?? 0
            return (
              <Link
                key={cat.id}
                href={`/dashboard/items?category=${cat.slug}`}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between group hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: palette.bg, color: palette.color }}
                  >
                    {cat.icon === 'Package' ? <Package className="w-6 h-6" /> : cat.icon || '📦'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{cat.name}</p>
                    <p className="text-sm text-gray-500">{myItems} item{myItems !== 1 ? 's' : ''}</p>
                    {cat.slug.startsWith('custom-') && (
                      <p className="text-xs text-blue-500 mt-0.5">Custom Category</p>
                    )}
                  </div>
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: palette.bg }}
                >
                  <span style={{ color: palette.color, fontSize: '12px' }}>→</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 justify-between">
        <div className="flex gap-3">
          <Package className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            Need a specific sub-category for your items? You can create custom categories for your business.
          </p>
        </div>
        <button 
          onClick={async () => {
            const name = prompt('Enter custom category name (e.g. Wedding Drones):')
            if (name) {
              const res = await fetch('/api/categories/custom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
              })
              if (res.ok) {
                window.location.reload()
              } else {
                alert('Failed to add category')
              }
            }
          }}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 whitespace-nowrap"
        >
          + Add Custom Category
        </button>
      </div>
    </div>
  )
}
