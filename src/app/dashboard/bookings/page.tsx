'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Plus, Search, ChevronDown, Eye, Edit2, MoreHorizontal, Filter, Download, Clock, CheckCircle2, XCircle, AlertTriangle, Package } from 'lucide-react'

const STATUS_TABS = [
  { key: 'all', label: 'All', count: 42 },
  { key: 'active', label: 'Active', count: 8 },
  { key: 'confirmed', label: 'Confirmed', count: 12 },
  { key: 'pending_confirmation', label: 'Pending', count: 5 },
  { key: 'returned_pending_settlement', label: 'To Settle', count: 3 },
  { key: 'overdue', label: 'Overdue', count: 2 },
  { key: 'completed', label: 'Completed', count: 10 },
  { key: 'quotation', label: 'Quotation', count: 2 },
]

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  confirmed: 'bg-blue-100 text-blue-800',
  pending_confirmation: 'bg-amber-100 text-amber-800',
  returned_pending_settlement: 'bg-purple-100 text-purple-800',
  overdue: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800',
  quotation: 'bg-indigo-100 text-indigo-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

const PAYMENT_STYLES: Record<string, string> = {
  paid: 'text-green-600',
  partially_paid: 'text-amber-600',
  unpaid: 'text-red-600',
  overdue: 'text-red-700',
  refunded: 'text-gray-500',
}

const mockBookings = [
  { id: 'BK-2024-001', customer: 'Kasun Perera', items: ['Sony A7III', 'DJI Ronin-S'], pickupDate: '2024-10-24', returnDate: '2024-10-26', status: 'active', paymentStatus: 'paid', total: 15000, deposit: 75000 },
  { id: 'BK-2024-002', customer: 'Malsha Fernando', items: ['Toyota Corolla'], pickupDate: '2024-10-25', returnDate: '2024-10-28', status: 'confirmed', paymentStatus: 'partially_paid', total: 24500, deposit: 100000 },
  { id: 'BK-2024-003', customer: 'Ravi Silva', items: ['Tent 6x6m', 'PA System'], pickupDate: '2024-10-26', returnDate: '2024-10-27', status: 'pending_confirmation', paymentStatus: 'unpaid', total: 8000, deposit: 20000 },
  { id: 'BK-2024-004', customer: 'Priya Jayawardena', items: ['Canon 5D', 'Lens Kit'], pickupDate: '2024-10-20', returnDate: '2024-10-24', status: 'returned_pending_settlement', paymentStatus: 'paid', total: 12000, deposit: 40000 },
  { id: 'BK-2024-005', customer: 'Nimal Dissanayake', items: ['Generator 5kW'], pickupDate: '2024-10-15', returnDate: '2024-10-17', status: 'overdue', paymentStatus: 'partially_paid', total: 6000, deposit: 30000 },
]

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = mockBookings.filter(b => {
    const matchSearch = b.customer.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase())
    const matchTab = activeTab === 'all' || b.status === activeTab
    return matchSearch && matchTab
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all rental orders</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 text-sm">
            <Download className="w-4 h-4" /> Export
          </button>
          <Link href="/dashboard/bookings/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm text-sm">
            <Plus className="w-4 h-4" /> New Booking
          </Link>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-blue-500' : 'bg-gray-100 text-gray-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by booking ID or customer..."
            className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Booking</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Items</th>
              <th className="px-6 py-3">Dates</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Payment</th>
              <th className="px-6 py-3 text-right">Total</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.map(booking => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-mono font-medium text-gray-900">{booking.id}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                      {booking.customer.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{booking.customer}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-0.5">
                    {booking.items.map((item, i) => (
                      <p key={i} className="text-gray-600 text-xs flex items-center gap-1">
                        <Package className="w-3 h-3" /> {item}
                      </p>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 text-xs">
                  <p>{booking.pickupDate}</p>
                  <p className="text-gray-400">→ {booking.returnDate}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                    {booking.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium ${PAYMENT_STYLES[booking.paymentStatus] || 'text-gray-600'}`}>
                    {booking.paymentStatus.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium">Rs. {booking.total.toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/dashboard/bookings/${booking.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link href={`/dashboard/bookings/${booking.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No bookings found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
