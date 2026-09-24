'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Plus, Search, Grid, List, Filter, Edit2, Trash2, Eye, Loader2 } from 'lucide-react'
import Image from 'next/image'

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  booked: 'bg-blue-100 text-blue-800',
  rented: 'bg-purple-100 text-purple-800',
  overdue: 'bg-red-100 text-red-800',
  maintenance: 'bg-amber-100 text-amber-800',
  damaged: 'bg-orange-100 text-orange-800',
  retired: 'bg-gray-100 text-gray-800',
}

const CONDITION_COLORS: Record<string, string> = {
  excellent: 'text-green-600',
  good: 'text-blue-600',
  fair: 'text-amber-600',
  poor: 'text-red-600',
}

export default function ItemsPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/items')
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Failed to fetch items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== id))
      } else {
        alert('Failed to delete item')
      }
    } catch (err) {
      alert('Error deleting item')
    }
  }

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} total items</p>
        </div>
        <Link
          href="/dashboard/items/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Item
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="overdue">Overdue</option>
            </select>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('grid')}
                className={`p-2 ${view === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p>Loading inventory...</p>
        </div>
      ) : (
        <>
          {/* Items Grid */}
          {view === 'grid' ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                    {item.itemImages && item.itemImages.length > 0 ? (
                      <Image src={item.itemImages[0].url} alt={item.name} fill className="object-cover" unoptimized />
                    ) : (
                      <Package className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate pr-2">{item.name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${STATUS_COLORS[item.status]}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{item.sku || 'No SKU'} · {item.category?.name}</p>
                    <p className={`text-xs font-medium mb-3 ${CONDITION_COLORS[item.conditionGrade || 'good']}`}>
                      {(item.conditionGrade || 'good').charAt(0).toUpperCase() + (item.conditionGrade || 'good').slice(1)} condition
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <div>
                        <p className="text-lg font-bold text-gray-900">Rs. {item.dailyRate.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">per day</p>
                      </div>
                      <div className="flex gap-1">
                        <Link href={`/dashboard/items/${item.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/dashboard/items/${item.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Item</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Condition</th>
                      <th className="px-6 py-3">Daily Rate</th>
                      <th className="px-6 py-3">Deposit</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filtered.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center relative overflow-hidden shrink-0">
                              {item.itemImages && item.itemImages.length > 0 ? (
                                <Image src={item.itemImages[0].url} alt={item.name} fill className="object-cover" unoptimized />
                              ) : (
                                <Package className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.sku || 'No SKU'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{item.category?.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[item.status]}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className={`px-6 py-4 font-medium ${CONDITION_COLORS[item.conditionGrade || 'good']}`}>
                          {(item.conditionGrade || 'good').charAt(0).toUpperCase() + (item.conditionGrade || 'good').slice(1)}
                        </td>
                        <td className="px-6 py-4 font-medium whitespace-nowrap">Rs. {item.dailyRate.toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">Rs. {item.depositAmount?.toLocaleString() || '0'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/dashboard/items/${item.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link href={`/dashboard/items/${item.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </Link>
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {!isLoading && filtered.length === 0 && (
            <div className="py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No items found. <Link href="/dashboard/items/new" className="text-blue-600 hover:underline">Add an item</Link></p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
