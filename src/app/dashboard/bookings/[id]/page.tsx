'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, X, CreditCard, Calendar, Truck, User, Info, FileText, CheckCircle2, Package } from 'lucide-react'
import Link from 'next/link'

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

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`)
      if (res.ok) {
        setBooking(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooking()
  }, [id])

  const handleAccept = async () => {
    if (!confirm('Are you sure you want to accept this request?')) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/provider/booking-requests/${id}/accept`, {
        method: 'POST'
      })
      const data = await res.json()
      if (res.ok) {
        alert('Request accepted successfully!')
        fetchBooking()
      } else {
        alert(data.error || 'Failed to accept request')
      }
    } catch (e) {
      console.error(e)
      alert('An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    setProcessing(true)
    try {
      const res = await fetch(`/api/provider/booking-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      })
      const data = await res.json()
      if (res.ok) {
        alert('Request rejected successfully')
        setIsRejecting(false)
        fetchBooking()
      } else {
        alert(data.error || 'Failed to reject request')
      }
    } catch (e) {
      console.error(e)
      alert('An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>
  if (!booking) return <div className="p-8 text-center text-gray-500">Booking not found</div>

  const customerName = booking.customer?.user?.name || 'Unknown'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{booking.bookingNumber || booking.id.substring(0, 8)}</h1>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-700'}`}>
              {booking.status.replace(/_/g, ' ')}
            </span>
            {booking.source === 'customer_marketplace' && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                Marketplace
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">Created on {new Date(booking.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {booking.status === 'pending_provider_approval' && (
        <div className="bg-white p-6 rounded-xl border border-purple-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">New Booking Request</h3>
            <p className="text-sm text-gray-600 mt-1">Review the details and accept or reject this request.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsRejecting(true)}
              disabled={processing}
              className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Reject Request
            </button>
            <button 
              onClick={handleAccept}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" /> {processing ? 'Processing...' : 'Accept Request'}
            </button>
          </div>
        </div>
      )}

      {isRejecting && (
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm space-y-4">
          <h3 className="text-red-800 font-medium">Reject Booking Request</h3>
          <textarea
            className="w-full p-3 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
            placeholder="Please provide a reason for rejection..."
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          ></textarea>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsRejecting(false)} className="px-4 py-2 text-gray-600 hover:bg-red-100 rounded-lg text-sm font-medium">Cancel</button>
            <button 
              onClick={handleReject} 
              disabled={processing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" /> Items
            </h2>
            <div className="space-y-4">
              {booking.bookingItems?.map((bi: any, i: number) => (
                <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50">
                  {bi.item?.images?.[0] ? (
                    <img src={bi.item.images[0]} alt={bi.item.name} className="w-20 h-20 object-cover rounded-lg" />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{bi.item?.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{bi.item?.category}</p>
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Rs. {bi.dailyRate}</span> / day &times; {bi.quantity} &times; {bi.days} days
                    </div>
                  </div>
                  <div className="text-right font-medium">
                    Rs. {bi.itemTotal}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" /> Rental Period
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Pickup</p>
                <p className="font-medium mt-1">{new Date(booking.pickupDate).toLocaleDateString()} {booking.pickupTime && `at ${booking.pickupTime}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Return</p>
                <p className="font-medium mt-1">{new Date(booking.returnDate).toLocaleDateString()} {booking.returnTime && `at ${booking.returnTime}`}</p>
              </div>
            </div>
          </div>

          {(booking.purpose || booking.notes) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" /> Details
              </h2>
              {booking.purpose && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Purpose of rental</p>
                  <p className="mt-1">{booking.purpose}</p>
                </div>
              )}
              {booking.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="mt-1 text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-100">{booking.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" /> Customer
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold uppercase">
                {customerName.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{customerName}</p>
                {booking.customer?.kycStatus === 'verified' && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> KYC Verified
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>{booking.customer?.user?.email}</p>
              <p>{booking.customer?.phone}</p>
              {booking.customer?.trustScore && <p>Trust Score: {booking.customer.trustScore}</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" /> Payment Summary
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Rs. {booking.subtotal || 0}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge</span>
                <span>Rs. {booking.deliveryCharge || 0}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Security Deposit</span>
                <span>Rs. {booking.depositAmount || 0}</span>
              </div>
              <div className="h-px bg-gray-100 my-2"></div>
              <div className="flex justify-between font-semibold text-gray-900 text-base">
                <span>Total Amount</span>
                <span>Rs. {booking.totalAmount || 0}</span>
              </div>
              <div className="flex justify-between text-amber-600 font-medium mt-2">
                <span>Advance Required</span>
                <span>Rs. {booking.advanceAmount || 0}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Balance Due</span>
                <span>Rs. {booking.balanceDue || 0}</span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100">
              <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[booking.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                Payment: {booking.paymentStatus.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
