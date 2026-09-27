'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ClipboardList, Plus, Search, Eye, Edit2, Download, Package, Check, X } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending_provider_approval', label: 'New Requests' },
  { key: 'awaiting_advance_payment', label: 'Awaiting Advance' },
  { key: 'active', label: 'Active' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'pending_confirmation', label: 'Pending' },
  { key: 'returned_pending_settlement', label: 'To Settle' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected_by_provider', label: 'Rejected' },
  { key: 'payment_expired', label: 'Payment Expired' },
  { key: 'quotation', label: 'Quotation' },
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
  pending_provider_approval: 'bg-purple-100 text-purple-800',
  rejected_by_provider: 'bg-red-100 text-red-800',
  awaiting_advance_payment: 'bg-yellow-100 text-yellow-800',
  payment_expired: 'bg-gray-100 text-gray-800',
}

const PAYMENT_STYLES: Record<string, string> = {
  paid: 'text-green-600',
  partially_paid: 'text-amber-600',
  unpaid: 'text-red-600',
  overdue: 'text-red-700',
  refunded: 'text-gray-500',
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch('/api/orders')
        if (res.ok) {
          const data = await res.json()
          setBookings(data)
        }
      } catch (e) {
        console.error('Failed to fetch bookings', e)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const filtered = bookings.filter(b => {
    const customerName = b.customer?.user?.name || 'Unknown'
    const matchSearch = customerName.toLowerCase().includes(search.toLowerCase()) || b.bookingNumber?.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase())
    const matchTab = activeTab === 'all' || b.status === activeTab
    return matchSearch && matchTab
  })

  // Calculate tab counts
  const counts: Record<string, number> = { all: bookings.length }
  STATUS_TABS.slice(1).forEach(tab => {
    counts[tab.key] = bookings.filter(b => b.status === tab.key).length
  })

  const getCustomerName = (booking: any) => booking.customer?.user?.name || 'Unknown'

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
        {STATUS_TABS.map(tab => {
          const count = counts[tab.key] || 0
          return (
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
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
              {tab.key === 'pending_provider_approval' && count > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1 right-1" />
              )}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by booking number or customer..."
            className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-500">Loading bookings...</div>
        ) : (
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
                    <p className="font-mono font-medium text-gray-900">{booking.bookingNumber || booking.id.substring(0, 8)}</p>
                    {booking.source === 'customer_marketplace' && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                        Marketplace
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold uppercase">
                        {getCustomerName(booking).charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{getCustomerName(booking)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      {booking.bookingItems?.map((bi: any, i: number) => (
                        <p key={i} className="text-gray-600 text-xs flex items-center gap-1">
                          <Package className="w-3 h-3" /> {bi.item?.name || 'Item'}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">
                    <p>{new Date(booking.pickupDate).toLocaleDateString()}</p>
                    <p className="text-gray-400">→ {new Date(booking.returnDate).toLocaleDateString()}</p>
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
                  <td className="px-6 py-4 text-right font-medium">Rs. {booking.totalAmount?.toLocaleString() || booking.total?.toLocaleString() || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 items-center">
                      {booking.status === 'pending_provider_approval' && (
                        <>
                          <button title="Accept" className="p-1.5 rounded-lg text-green-600 hover:bg-green-50" onClick={() => window.location.href=`/dashboard/bookings/${booking.id}`}>
                            <Check className="w-4 h-4" />
                          </button>
                          <button title="Reject" className="p-1.5 rounded-lg text-red-600 hover:bg-red-50" onClick={() => window.location.href=`/dashboard/bookings/${booking.id}`}>
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
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
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-gray-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No bookings found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
