'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, Calendar, Filter } from 'lucide-react'

export default function CustomerBookingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) { router.replace('/auth/signin'); return }
    
    fetch('/api/customer/booking-requests')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBookings(data)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [session, status, router])

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center py-20 bg-gray-50">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  const renderBookingList = (statusFilter?: string | string[]) => {
    let filtered = bookings
    if (statusFilter) {
      if (Array.isArray(statusFilter)) {
        filtered = bookings.filter(b => statusFilter.includes(b.status))
      } else {
        filtered = bookings.filter(b => b.status === statusFilter)
      }
    }

    if (filtered.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">No bookings found for this category.</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {filtered.map(booking => (
          <div key={booking.id} className="bg-white p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{booking.bookingItems?.[0]?.item?.name || 'Item'}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    booking.status === 'awaiting_advance_payment' ? 'bg-red-100 text-red-800' :
                    booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p><span className="font-medium text-gray-700">Booking #:</span> {booking.bookingNumber}</p>
                  <p><span className="font-medium text-gray-700">Provider:</span> {booking.business?.name}</p>
                  <p className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(booking.pickupDate)} - {formatDate(booking.returnDate)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                <div className="text-right w-full">
                  <p className="font-bold text-lg text-gray-900">{formatCurrency(booking.totalAmount)}</p>
                  {booking.status === 'awaiting_advance_payment' && (
                    <p className="text-sm text-orange-600 font-medium mt-1">
                      Advance: {formatCurrency(booking.advanceAmount)}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 w-full md:w-auto justify-end">
                  {booking.status === 'pending_provider_approval' && (
                    <button className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">
                      Cancel Request
                    </button>
                  )}
                  {booking.status === 'awaiting_advance_payment' && (
                    <Link href={`/customer/bookings/${booking.id}/pay-advance`}>
                      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Pay Advance
                      </button>
                    </Link>
                  )}
                  <Link href={`/customer/bookings/${booking.id}`}>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/customer/dashboard" className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">R</span>
            RentHelper
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/marketplace" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              Marketplace
            </Link>
            <Link href="/customer/bookings" className="text-sm font-medium text-blue-600 transition-colors">
              My Bookings
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {session?.user?.name?.[0]?.toUpperCase() || 'C'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-500">Manage your rental bookings and requests</p>
          </div>
          <Link href="/marketplace">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              Browse Rentals
            </button>
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200 mb-6">
          {[
            { label: 'All', value: 'all' },
            { label: 'Pending', value: 'pending' },
            { label: 'To Pay', value: 'awaiting_payment' },
            { label: 'Active', value: 'active' },
            { label: 'Completed', value: 'completed' },
            { label: 'Rejected/Expired', value: 'rejected' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          {activeTab === 'all' && renderBookingList()}
          {activeTab === 'pending' && renderBookingList('pending_provider_approval')}
          {activeTab === 'awaiting_payment' && renderBookingList('awaiting_advance_payment')}
          {activeTab === 'active' && renderBookingList(['confirmed', 'active'])}
          {activeTab === 'completed' && renderBookingList('completed')}
          {activeTab === 'rejected' && renderBookingList(['rejected', 'cancelled', 'payment_expired'])}
        </div>
      </div>
    </div>
  )
}
