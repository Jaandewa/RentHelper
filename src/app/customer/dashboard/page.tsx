'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  CheckCircle, ShoppingBag, Search, Clock, Package, 
  ArrowRight, Star, MapPin, LogOut 
} from 'lucide-react'
import { signOut } from 'next-auth/react'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) { router.replace('/auth/signin'); return }
    
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        setUser(d.user)
        // If not verified, redirect
        if (d.user?.customerProfile?.kycStatus !== 'verified') {
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{user.customerProfile?.totalBookings || 0}</p>
                <p className="text-sm text-gray-500">Total Bookings</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{(user.customerProfile?.trustScore || 0).toFixed(1)}</p>
                <p className="text-sm text-gray-500">Trust Score</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 capitalize">{user.customerProfile?.kycStatus}</p>
                <p className="text-sm text-gray-500">KYC Status</p>
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

        {/* Recent Activity placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" /> Recent Activity
          </h2>
          <div className="text-center py-8 text-gray-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No bookings yet. Start browsing the marketplace!</p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
              Explore Marketplace <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
