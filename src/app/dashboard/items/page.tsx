'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package, Plus, Search, Grid, List, Filter, Edit2, Trash2, Eye, ChevronDown } from 'lucide-react'

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

const mockItems = [
  { id: '1', name: 'Sony A7III Camera', sku: 'CAM-001', category: 'Camera & Video', status: 'available', condition: 'excellent', dailyRate: 5000, depositAmount: 50000, image: null },
  { id: '2', name: 'DJI Ronin-S Gimbal', sku: 'GIM-001', category: 'Camera & Video', status: 'rented', condition: 'good', dailyRate: 2500, depositAmount: 25000, image: null },
  { id: '3', name: 'Aputure 120D Light', sku: 'LGT-001', category: 'Camera & Video', status: 'available', condition: 'good', dailyRate: 1500, depositAmount: 15000, image: null },
  { id: '4', name: 'Toyota Corolla 2022', sku: 'VEH-001', category: 'Vehicles', status: 'booked', condition: 'excellent', dailyRate: 8000, depositAmount: 100000, image: null },
  { id: '5', name: 'Tent 6x6m', sku: 'TNT-001', category: 'Party & Events', status: 'available', condition: 'good', dailyRate: 3500, depositAmount: 20000, image: null },
  { id: '6', name: 'Sennheiser EW100 Mic', sku: 'MIC-001', category: 'Camera & Video', status: 'maintenance', condition: 'fair', dailyRate: 800, depositAmount: 8000, image: null },
]

export default function ItemsPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = mockItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">{mockItems.length} total items</p>
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
            <button className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
              <Filter className="w-4 h-4" /> Filter
            </button>
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

      {/* Items Grid */}
      {view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
                  <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${STATUS_COLORS[item.status]}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{item.sku} · {item.category}</p>
                <p className={`text-xs font-medium mb-3 ${CONDITION_COLORS[item.condition]}`}>
                  {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)} condition
                </p>
                <div className="flex justify-between items-center">
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
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
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
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{item.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-medium ${CONDITION_COLORS[item.condition]}`}>
                    {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                  </td>
                  <td className="px-6 py-4 font-medium">Rs. {item.dailyRate.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600">Rs. {item.depositAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/items/${item.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/dashboard/items/${item.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No items found. <Link href="/dashboard/items/new" className="text-blue-600 hover:underline">Add your first item</Link></p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
