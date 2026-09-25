'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Phone, Mail, MapPin, Star, ShieldCheck, ShieldAlert, Calendar, Plus, AlertTriangle, Clock } from 'lucide-react'

interface CustomerDetail {
  id: string
  displayId: string
  fullName: string
  email: string
  primaryContactNumber: string
  secondaryContactNumber: string | null
  city: string
  kycStatus: string
  accountStatus: string
  trustScore: number
  totalBookings: number
  blacklistStatus: string
  blacklistReason: string | null
  createdAt: string
  bookingsWithProvider: Array<{
    id: string
    bookingNumber: string
    status: string
    totalAmount: number
    pickupDate: string
    returnDate: string
  }>
}

export default function ProviderCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/customers`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.customers || []
        const found = list.find((c: any) => c.id === id || c.displayId === id)
        if (found) {
          setCustomer(found)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Customer Not Found</h2>
        <Link href="/dashboard/customers" className="text-blue-600 underline text-sm inline-block">
          Return to Customer Directory
        </Link>
      </div>
    )
  }

  const isVerified = customer.kycStatus === 'verified' || customer.kycStatus === 'approved'
  const isBlacklisted = customer.blacklistStatus !== 'NONE'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/customers" className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{customer.fullName}</h1>
              <span className="font-mono text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-semibold">
                {customer.displayId}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Platform Customer Profile</p>
          </div>
        </div>

        <Link
          href={`/dashboard/bookings/new?customerId=${customer.id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Create Booking for Customer
        </Link>
      </div>

      {/* Blacklist / Warning Banner */}
      {isBlacklisted && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Customer Warning ({customer.blacklistStatus})</p>
            <p className="text-xs text-red-700 mt-0.5">{customer.blacklistReason || 'This customer has an active warning or blacklist entry on the platform.'}</p>
          </div>
        </div>
      )}

      {/* Profile Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" /> Customer Information
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Full Name</p>
              <p className="font-medium text-gray-900">{customer.fullName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Customer Display ID</p>
              <p className="font-mono font-semibold text-blue-700">{customer.displayId}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Email Address</p>
              <p className="font-medium text-gray-900 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {customer.email}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">City / Location</p>
              <p className="font-medium text-gray-900 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {customer.city}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Primary Contact Phone</p>
              <p className="font-medium text-gray-900 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {customer.primaryContactNumber}</p>
            </div>
            {customer.secondaryContactNumber && (
              <div>
                <p className="text-gray-500 text-xs">Secondary Contact Phone</p>
                <p className="font-medium text-gray-900 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {customer.secondaryContactNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* Verification & Trust */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" /> Status & Trust
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs mb-1">Identity Verification (KYC)</p>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isVerified ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isVerified ? 'KYC Verified ✓' : 'KYC Pending / Unverified'}
              </span>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-gray-500 text-xs">Trust Score</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-base font-bold text-gray-900">
                  {customer.trustScore ? customer.trustScore.toFixed(1) : 'No Ratings Yet'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-gray-500 text-xs">Total Platform Bookings</p>
              <p className="text-base font-bold text-gray-900 mt-0.5">{customer.totalBookings} orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
