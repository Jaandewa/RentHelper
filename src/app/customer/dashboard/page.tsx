'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  CheckCircle, ShoppingBag, Search, Clock, Package, 
  ArrowRight, Star, LogOut, FileText, AlertCircle, Calendar
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  customerProfile: {
    kycStatus: string
    trustScore: number
    totalBookings: number
    phone: string | null
  } | null
}

export default function CustomerDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserData | null>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) { router.replace('/auth/signin'); return }
    
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/customer/booking-requests').then(r => r.json())
    ])
      .then(([userData, bookingsData]) => {
        setUser(userData.user)
        if (Array.isArray(bookingsData)) {
          setBookings(bookingsData)
        }
        
        // If not verified, redirect
        if (userData.user?.customerProfile?.kycStatus !== 'verified') {
          router.replace('/customer/pending-approval')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [session, status, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const categories = [
    { name: 'Camera & Video', icon: '📸', slug: 'camera-video' },
    { name: 'Vehicles', icon: '🚗', slug: 'vehicles' },
    { name: 'Party & Events', icon: '🎉', slug: 'party-events' },
    { name: 'Tools & Equipment', icon: '🔧', slug: 'tools-equipment' },
    { name: 'IT Equipment', icon: '💻', slug: 'it-equipment' },
    { name: 'Musical Instruments', icon: '🎸', slug: 'musical' },
  ]

  const pendingCount = bookings.filter(b => b.status === 'pending_provider_approval').length
  const awaitingPaymentCount = bookings.filter(b => b.status === 'awaiting_advance_payment').length
  const activeCount = bookings.filter(b => ['confirmed', 'active'].includes(b.status)).length
  const completedCount = bookings.filter(b => b.status === 'completed').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/customer/dashboard" className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">R</span>
            RentHelper
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/marketplace" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              Marketplace
            </Link>
            <Link href="/customer/bookings" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              My Bookings
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {user.name?.[0]?.toUpperCase() || 'C'}
              </div>
              <button onClick={() => signOut({ callbackUrl: '/auth/signin' })} className="text-gray-400 hover:text-red-500">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Welcome, {user.name}! 👋</h1>
              <p className="text-blue-100 text-sm">Browse rental items from verified providers across Sri Lanka.</p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Verified</span>
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <Link 
              href="/marketplace"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" /> Browse Rentals
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 bg-white/20 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-white/30 transition-colors"
            >
              <Search className="w-4 h-4" /> Search Items
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-xs text-gray-500 font-medium uppercase">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{awaitingPaymentCount}</p>
                <p className="text-xs text-gray-500 font-medium uppercase">To Pay</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                <p className="text-xs text-gray-500 font-medium uppercase">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
                <p className="text-xs text-gray-500 font-medium uppercase">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Browse by Category</h2>
            <Link href="/marketplace" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map(cat => (
              <Link
                key={cat.slug}
                href={`/marketplace?category=${cat.slug}`}
                className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <p className="text-xs font-medium text-gray-600 group-hover:text-blue-600">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" /> Recent Bookings
            </h2>
            <Link href="/customer/bookings" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No bookings yet. Start browsing the marketplace!</p>
              <Link href="/marketplace" className="inline-flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                Explore Marketplace <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.slice(0, 5).map(booking => (
                <div key={booking.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{booking.bookingItems?.[0]?.item?.name || 'Item'}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === 'awaiting_advance_payment' ? 'bg-red-100 text-red-800' :
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {booking.bookingNumber} • Provider: {booking.business?.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(booking.pickupDate)} - {formatDate(booking.returnDate)}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 text-right w-full sm:w-auto">
                    <p className="font-bold text-lg">{formatCurrency(booking.totalAmount)}</p>
                    {booking.status === 'awaiting_advance_payment' ? (
                      <Link href={`/customer/bookings/${booking.id}/pay-advance`}>
                        <button className="mt-2 w-full sm:w-auto px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Pay Advance
                        </button>
                      </Link>
                    ) : (
                      <Link href={`/customer/bookings/${booking.id}`}>
                        <button className="mt-2 w-full sm:w-auto px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                          View Details
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
