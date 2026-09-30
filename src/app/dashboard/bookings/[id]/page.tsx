'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, X, CreditCard, Calendar, Truck, User, FileText, CheckCircle2, Package, Clock, AlertCircle, Shield, MapPin, Star } from 'lucide-react'
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

const STATUS_LABELS: Record<string, string> = {
  pending_provider_approval: 'Pending Approval',
  awaiting_advance_payment: 'Awaiting Advance Payment',
  confirmed: 'Confirmed',
  active: 'Active',
  completed: 'Completed',
  rejected_by_provider: 'Rejected',
  payment_expired: 'Payment Expired',
  cancelled: 'Cancelled',
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Review states
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [hoverStar, setHoverStar] = useState(0)

  // Feedback states
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

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
    setProcessing(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/provider/booking-requests/${id}/accept`, {
        method: 'POST'
      })
      const data = await res.json()
      if (res.ok) {
        setSuccessMsg('Request accepted! Customer has been notified to pay the advance.')
        setShowAcceptModal(false)
        fetchBooking()
      } else {
        setErrorMsg(data.error || 'Failed to accept request')
      }
    } catch (e) {
      console.error(e)
      setErrorMsg('An error occurred while accepting')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setErrorMsg('Please provide a reason for rejection')
      return
    }
    setProcessing(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/provider/booking-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccessMsg('Request rejected. Customer has been notified.')
        setShowRejectModal(false)
        setRejectReason('')
        fetchBooking()
      } else {
        setErrorMsg(data.error || 'Failed to reject request')
      }
    } catch (e) {
      console.error(e)
      setErrorMsg('An error occurred while rejecting')
    } finally {
      setProcessing(false)
    }
  }

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      setReviewError('Please select a star rating')
      return
    }
    setReviewSubmitting(true)
    setReviewError('')
    try {
      const res = await fetch(`/api/provider/bookings/${id}/review-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, reviewText: reviewText.trim() || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        setReviewSuccess(true)
        const updated = await fetch(`/api/orders/${id}`).then(r => r.json())
        setBooking(updated)
      } else {
        setReviewError(data.error || 'Failed to submit review')
      }
    } catch {
      setReviewError('An error occurred')
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>
  if (!booking) return <div className="p-8 text-center text-gray-500">Booking not found</div>

  const customerName = booking.customer?.user?.name || 'Unknown'
  const statusLabel = STATUS_LABELS[booking.status] || booking.status.replace(/_/g, ' ')

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{booking.bookingNumber || booking.id.substring(0, 8)}</h1>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-700'}`}>
              {statusLabel}
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

      {/* Success/Error Messages */}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-green-800 font-medium">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg('')} className="ml-auto text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg('')} className="ml-auto text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Approval Action Bar */}
      {booking.status === 'pending_provider_approval' && (
        <div className="bg-white p-6 rounded-xl border border-purple-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">New Booking Request</h3>
            <p className="text-sm text-gray-600 mt-1">Review the details below and accept or reject this request.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowRejectModal(true)}
              disabled={processing}
              className="px-5 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <span className="flex items-center gap-2"><X className="w-4 h-4" /> Reject Request</span>
            </button>
            <button 
              onClick={() => setShowAcceptModal(true)}
              disabled={processing}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Accept Request
            </button>
          </div>
        </div>
      )}

      {/* Awaiting Advance Payment Status Bar */}
      {booking.status === 'awaiting_advance_payment' && (
        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 shadow-sm">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">Awaiting Customer Advance Payment</h3>
              <p className="text-sm text-yellow-800 mt-1">
                You accepted this request. The customer has been notified to pay the advance of <strong>Rs. {booking.advanceAmount?.toLocaleString()}</strong>.
              </p>
              {booking.holdExpiresAt && (
                <p className="text-sm text-yellow-700 mt-2">
                  Payment deadline: <strong>{new Date(booking.holdExpiresAt).toLocaleString()}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmed Status Bar */}
      {booking.status === 'confirmed' && (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Booking Confirmed</h3>
              <p className="text-sm text-blue-800 mt-1">
                Customer has paid the advance. This booking is confirmed and the item is reserved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejected Status Bar */}
      {booking.status === 'rejected_by_provider' && (
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm">
          <div className="flex items-start gap-3">
            <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Request Rejected</h3>
              {booking.providerRejectReason && (
                <p className="text-sm text-red-800 mt-1">Reason: {booking.providerRejectReason}</p>
              )}
              {booking.providerDecisionAt && (
                <p className="text-xs text-red-700 mt-1">Rejected on {new Date(booking.providerDecisionAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Items */}
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
                      <span className="font-medium">Rs. {bi.dailyRate?.toLocaleString()}</span> / day &times; {bi.quantity} &times; {bi.days} days
                    </div>
                  </div>
                  <div className="text-right font-medium">
                    Rs. {bi.itemTotal?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rental Period */}
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

          {/* Details & Notes */}
          {(booking.purpose || booking.notes || booking.deliveryRequired) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" /> Details
              </h2>
              {booking.purpose && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Purpose of rental</p>
                  <p className="mt-1 font-medium">{booking.purpose}</p>
                  {booking.purposeDetails && (
                    <p className="mt-1 text-sm text-gray-600">{booking.purposeDetails}</p>
                  )}
                </div>
              )}
              {booking.deliveryRequired && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Delivery Required</p>
                  {booking.deliveryAddress && (
                    <p className="mt-1 text-sm bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      {booking.deliveryAddress}
                    </p>
                  )}
                </div>
              )}
              {booking.notes && (
                <div>
                  <p className="text-sm text-gray-500">Customer Notes</p>
                  <p className="mt-1 text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-100">{booking.notes}</p>
                </div>
              )}
              {booking.agreementAccepted && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-700">
                  <Shield className="w-4 h-4" />
                  <span>Customer agreed to terms (v{booking.agreementVersion || '1.0'})</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
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
              {booking.customer?.user?.email && <p>{booking.customer.user.email}</p>}
              {booking.customer?.phone && <p>{booking.customer.phone}</p>}
              {booking.customer?.trustScore != null && <p>Trust Score: {booking.customer.trustScore}</p>}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" /> Payment Summary
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Rental Subtotal</span>
                <span>Rs. {(booking.subtotal || 0).toLocaleString()}</span>
              </div>
              {(booking.deliveryCharge || 0) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charge</span>
                  <span>Rs. {booking.deliveryCharge.toLocaleString()}</span>
                </div>
              )}
              <div className="h-px bg-gray-100 my-2"></div>
              <div className="flex justify-between font-semibold text-gray-900 text-base">
                <span>Rental Total</span>
                <span>Rs. {(booking.totalAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Security Deposit</span>
                <span>Rs. {(booking.depositAmount || 0).toLocaleString()}</span>
              </div>
              <div className="h-px bg-gray-100 my-2"></div>
              <div className="flex justify-between text-amber-600 font-medium">
                <span>Advance Required</span>
                <span>Rs. {(booking.advanceAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Balance Due</span>
                <span>Rs. {(booking.balanceDue || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[booking.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                Payment: {(booking.paymentStatus || 'unpaid').replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Rate Customer Section */}
          {booking.status === 'completed' && !booking.providerReviewed && !booking.customerRating && !reviewSuccess && (
            <div className="bg-white rounded-xl border-2 border-amber-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" /> Rate This Customer
              </h2>
              <p className="text-sm text-gray-600 mb-4">How was your experience with <strong>{booking.customer?.user?.name || 'this customer'}</strong>?</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating *</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" className="transition-transform hover:scale-110" onMouseEnter={() => setHoverStar(star)} onMouseLeave={() => setHoverStar(0)} onClick={() => setReviewRating(star)}>
                        <Star className={`w-8 h-8 ${star <= (hoverStar || reviewRating) ? 'fill-amber-400 text-amber-400' : 'fill-none text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                  {reviewRating > 0 && <p className="text-sm text-gray-500 mt-1">{reviewRating === 5 ? 'Excellent!' : reviewRating === 4 ? 'Very Good' : reviewRating === 3 ? 'Average' : reviewRating === 2 ? 'Below Average' : 'Poor'}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Write a Review (optional)</label>
                  <textarea className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none" placeholder="Share your experience with this customer..." rows={3} maxLength={500} value={reviewText} onChange={e => setReviewText(e.target.value)} />
                  <p className="text-xs text-gray-400 mt-1">{reviewText.length}/500</p>
                </div>
                {reviewError && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle className="w-4 h-4" /> {reviewError}</div>}
                <button onClick={handleSubmitReview} disabled={reviewSubmitting || reviewRating === 0} className="px-6 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {reviewSubmitting ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Submitting...</>) : (<><Star className="w-4 h-4" /> Submit Review</>)}
                </button>
              </div>
            </div>
          )}

          {/* Review Submitted */}
          {(reviewSuccess || booking.providerReviewed || booking.customerRating) && (
            <div className="bg-green-50 rounded-xl border border-green-200 shadow-sm p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900">Customer Review Submitted</h3>
                  {booking.customerRating && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-4 h-4 ${s <= Math.round(booking.customerRating.overallScore) ? 'fill-amber-400 text-amber-400' : 'fill-none text-gray-300'}`} />)}
                        <span className="text-sm text-gray-600">{booking.customerRating.overallScore}/5</span>
                      </div>
                      {booking.customerRating.review && <p className="mt-2 text-sm text-gray-700 italic">"{booking.customerRating.review}"</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accept Confirmation Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Accept Booking Request</h3>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-gray-600">Accepting will notify the customer and create a 24-hour payment hold:</p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-500">Advance Required</span>
                  <span className="font-semibold">Rs. {(booking.advanceAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Deadline</span>
                  <span className="font-medium">24 hours from now</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Item Hold</span>
                  <span className="font-medium text-green-600">Active until payment</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">If the customer does not pay within the deadline, the hold will expire automatically.</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAcceptModal(false)}
                disabled={processing}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={processing}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {processing ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Accepting...</>
                ) : (
                  <><Check className="w-4 h-4" /> Accept Request</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Reject Booking Request</h3>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">The customer will be notified of the rejection and the reason provided.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for rejection *</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                  placeholder="e.g. Item not available, dates conflict with maintenance, etc."
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); setErrorMsg('') }}
                disabled={processing}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {processing ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Rejecting...</>
                ) : (
                  <><X className="w-4 h-4" /> Confirm Rejection</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
