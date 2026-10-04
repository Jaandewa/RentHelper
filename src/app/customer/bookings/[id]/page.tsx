'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, Package, Calendar, CreditCard, Building2, CheckCircle2, Clock, AlertCircle, Shield } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  pending_provider_approval: 'bg-purple-100 text-purple-800',
  awaiting_advance_payment: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  returned_pending_settlement: 'bg-purple-100 text-purple-800',
  completed: 'bg-gray-100 text-gray-800',
  rejected_by_provider: 'bg-red-100 text-red-800',
  payment_expired: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  pending_provider_approval: 'Awaiting Provider',
  awaiting_advance_payment: 'Pay Advance',
  confirmed: 'Confirmed',
  active: 'Active Rental',
  returned_pending_settlement: 'Return Pending',
  completed: 'Completed',
  rejected_by_provider: 'Rejected',
  payment_expired: 'Payment Expired',
  cancelled: 'Cancelled',
}

function StarPicker({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={`transition-transform ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
          onClick={() => !disabled && onChange(star)}
        >
          <Star
            className={`w-8 h-8 ${
              star <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star key={star} className={`${cls} ${star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-none text-gray-300'}`} />
      ))}
    </div>
  )
}

export default function CustomerBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Review form state
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [reviewError, setReviewError] = useState('')

  // Return states
  const [returnProcessing, setReturnProcessing] = useState(false)
  const [returnNotes, setReturnNotes] = useState('')
  const [returnSuccess, setReturnSuccess] = useState('')
  const [returnError, setReturnError] = useState('')
  const [settlement, setSettlement] = useState<any>(null)

  // Cancellation states
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/customer/booking-requests/${id}`)
      if (res.ok) {
        const data = await res.json()
        setBooking(data)
      }
    } catch {} finally { setLoading(false) }
  }

  const fetchSettlement = async () => {
    try {
      const res = await fetch(`/api/customer/bookings/${id}/inspections`)
      if (res.ok) {
        const data = await res.json()
        setSettlement(data.depositSettlement || null)
      }
    } catch {}
  }

  useEffect(() => {
    fetchBooking()
  }, [id])

  useEffect(() => {
    if (booking?.status === 'completed') fetchSettlement()
  }, [booking?.status])

  const handleSubmitReview = async () => {
    if (rating === 0) {
      setReviewError('Please select a star rating')
      return
    }
    setSubmitting(true)
    setReviewError('')

    try {
      const res = await fetch(`/api/customer/bookings/${id}/review-provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, reviewText: reviewText.trim() || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        setReviewSuccess(true)
        // Refresh booking
        const updated = await fetch(`/api/customer/booking-requests/${id}`).then(r => r.json())
        setBooking(updated)
      } else {
        setReviewError(data.error || 'Failed to submit review')
      }
    } catch {
      setReviewError('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>
  if (!booking) return <div className="p-8 text-center text-gray-500">Booking not found</div>

  const itemName = booking.bookingItems?.[0]?.item?.name || 'Rental item'
  const providerName = booking.business?.name || 'Provider'
  const statusLabel = STATUS_LABELS[booking.status] || booking.status.replace(/_/g, ' ')
  const canReview = booking.status === 'completed' && !booking.customerReviewed && !booking.providerRating
  const hasReview = booking.providerRating || booking.customerReviewed

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{booking.bookingNumber}</h1>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-700'}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{new Date(booking.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Active Rental Banner */}
      {booking.status === 'active' && (
        <div className="bg-green-50 p-6 rounded-xl border border-green-200 shadow-sm">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900">Item Handed Over — Active Rental</h3>
              <p className="text-sm text-green-800 mt-1">
                Return due: {new Date(booking.returnDate).toLocaleDateString()}{booking.returnTime ? ` at ${booking.returnTime}` : ''}
              </p>
              <div className="mt-3 space-y-2">
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="Return notes (optional)..."
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                />
                <button
                  onClick={async () => {
                    setReturnProcessing(true); setReturnError('')
                    try {
                      const res = await fetch(`/api/customer/bookings/${id}/mark-return`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ notes: returnNotes.trim() || undefined }),
                      })
                      if (res.ok) { setReturnSuccess('Item marked as returned. The provider will complete the inspection.'); fetchBooking() }
                      else { const d = await res.json(); setReturnError(d.error || 'Failed to mark return') }
                    } catch { setReturnError('Network error') }
                    setReturnProcessing(false)
                  }}
                  disabled={returnProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {returnProcessing ? 'Processing...' : 'Mark Item Ready to Return'}
                </button>
                {returnError && <p className="text-sm text-red-600">{returnError}</p>}
                {returnSuccess && <p className="text-sm text-green-700 font-medium">{returnSuccess}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Pending Banner */}
      {booking.status === 'returned_pending_settlement' && (
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-sm">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-purple-900">Return In Progress</h3>
              <p className="text-sm text-purple-800 mt-1">Your item return is being processed. The provider will complete the inspection and deposit settlement.</p>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Settlement Card */}
      {booking.status === 'completed' && settlement && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" /> Deposit Settlement
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Security deposit paid</span><span className="font-medium">Rs. {settlement.originalDepositAmount?.toLocaleString()}</span></div>
            {settlement.deductionAmount > 0 && (
              <>
                <div className="flex justify-between"><span className="text-gray-600">Deduction</span><span className="text-red-600 font-medium">- Rs. {settlement.deductionAmount?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Reason</span><span className="text-gray-800">{settlement.deductionReasonText || 'N/A'}</span></div>
              </>
            )}
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between font-semibold"><span>Refund amount</span><span className="text-green-700">Rs. {settlement.refundAmount?.toLocaleString()}</span></div>
            <div className="flex justify-between text-gray-600"><span>Status</span><span className="capitalize">{(settlement.settlementStatus || '').replace(/_/g, ' ').toLowerCase()}</span></div>
            {settlement.settlementMethod && <div className="flex justify-between text-gray-600"><span>Method</span><span className="capitalize">{settlement.settlementMethod.replace(/_/g, ' ').toLowerCase()}</span></div>}
            {settlement.refundReference && <div className="flex justify-between text-gray-600"><span>Reference</span><span>{settlement.refundReference}</span></div>}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Item Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" /> Items
            </h2>
            {booking.bookingItems?.map((bi: any, i: number) => (
              <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50">
                {bi.item?.images?.[0] ? (
                  <img src={bi.item.images[0]} alt={bi.item.name} className="w-20 h-20 object-cover rounded-lg" />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{bi.item?.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{bi.item?.category}</p>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Rs. {bi.dailyRate?.toLocaleString()}</span> / day × {bi.quantity} × {bi.days} days
                  </p>
                </div>
                <div className="text-right font-medium">Rs. {bi.itemTotal?.toLocaleString()}</div>
              </div>
            ))}
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

          {/* Review Section */}
          {canReview && !reviewSuccess && (
            <div className="bg-white rounded-xl border-2 border-amber-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" /> Rate Your Experience
              </h2>
              <p className="text-sm text-gray-600 mb-4">How was your rental experience with <strong>{providerName}</strong>?</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating *</label>
                  <StarPicker value={rating} onChange={setRating} />
                  {rating > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : rating === 2 ? 'Below Average' : 'Poor'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Write a Review (optional)</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
                    placeholder="Share your experience with this provider..."
                    rows={3}
                    maxLength={500}
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">{reviewText.length}/500</p>
                </div>

                {reviewError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" /> {reviewError}
                  </div>
                )}

                <button
                  onClick={handleSubmitReview}
                  disabled={submitting || rating === 0}
                  className="px-6 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Submitting...</>
                  ) : (
                    <><Star className="w-4 h-4" /> Submit Review</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Review Success */}
          {(reviewSuccess || hasReview) && (
            <div className="bg-green-50 rounded-xl border border-green-200 shadow-sm p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900">Review Submitted</h3>
                  {booking.providerRating && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={booking.providerRating.overallScore} />
                        <span className="text-sm text-gray-600">{booking.providerRating.overallScore}/5</span>
                      </div>
                      {booking.providerRating.review && (
                        <p className="mt-2 text-sm text-gray-700 italic">"{booking.providerRating.review}"</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Provider */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-400" /> Provider
            </h2>
            <p className="font-medium text-gray-900">{providerName}</p>
            {booking.business?.city && <p className="text-sm text-gray-500 mt-1">{booking.business.city}</p>}
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" /> Payment Summary
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Rental Total</span>
                <span className="font-medium">Rs. {(booking.totalAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Security Deposit</span>
                <span>Rs. {(booking.depositAmount || 0).toLocaleString()}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between text-gray-600">
                <span>Advance Paid</span>
                <span className="text-green-600 font-medium">Rs. {(booking.advanceAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Balance Due</span>
                <span>Rs. {(booking.balanceDue || 0).toLocaleString()}</span>
              </div>

              {/* Refund breakdown if cancelled or refunds exist */}
              {(booking.status === 'cancelled' || (booking.refunds && booking.refunds.length > 0)) && (
                <>
                  <div className="h-px bg-gray-200 my-2" />
                  <div className="flex justify-between text-gray-600">
                    <span>Rental Paid</span>
                    <span className="font-medium">Rs. {((booking.payments || []).filter((p: any) => p.type === 'advance' || p.type === 'balance').reduce((a: number, p: any) => a + p.amount, 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Refund Pending</span>
                    <span className="font-medium">Rs. {((booking.refunds || []).filter((r: any) => r.status === 'PENDING' || r.status === 'PROCESSING').reduce((a: number, r: any) => a + r.amount, 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>Refund Processed</span>
                    <span className="font-medium">Rs. {((booking.refunds || []).filter((r: any) => r.status === 'PROCESSED').reduce((a: number, r: any) => a + r.amount, 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 font-medium">
                    <span>Retained / Non-Refundable</span>
                    <span>Rs. {Math.max(0, ((booking.payments || []).filter((p: any) => p.type === 'advance' || p.type === 'balance').reduce((a: number, p: any) => a + p.amount, 0)) - ((booking.refunds || []).filter((r: any) => r.status === 'PENDING' || r.status === 'PROCESSING' || r.status === 'PROCESSED').reduce((a: number, r: any) => a + r.amount, 0))).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Refund Lifecycle Records Panel */}
          {booking.refunds && booking.refunds.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
              <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" /> Refund History
              </h3>
              {booking.refunds.map((r: any) => (
                <div key={r.id} className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>Rs. {r.amount?.toLocaleString()}</span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      r.status === 'PROCESSED' ? 'bg-green-100 text-green-800' :
                      r.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      r.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  {r.referenceId && <p className="text-xs text-gray-500">Ref: {r.referenceId}</p>}
                  {r.processedAt && <p className="text-xs text-gray-400">Processed: {new Date(r.processedAt).toLocaleDateString()}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {booking.status === 'awaiting_advance_payment' && (
              <Link href={`/customer/bookings/${id}/pay-advance`} className="block w-full">
                <button className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  Pay Advance
                </button>
              </Link>
            )}

            {/* Cancel Booking Button */}
            {['pending_provider_approval', 'awaiting_advance_payment', 'confirmed'].includes(booking.status) && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Cancel Booking #{booking.bookingNumber}?</h3>
            <p className="text-sm text-gray-600">
              Cancellation refund percentage depends on notice time before pickup date ({new Date(booking.pickupDate).toLocaleDateString()} {booking.pickupTime || ''}):
            </p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4 bg-gray-50 p-3 rounded-lg">
              <li>&gt; 48 hours notice: 100% rental payment refund</li>
              <li>24 - 48 hours notice: 50% rental payment refund</li>
              <li>&lt; 24 hours notice: Non-refundable (0%)</li>
            </ul>

            {booking.payments?.some((p: any) => p.type === 'deposit') && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium">
                A security deposit requires separate review.
              </div>
            )}

            {cancelError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{cancelError}</div>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Keep Booking
              </button>
              <button
                onClick={async () => {
                  setCancelling(true)
                  setCancelError('')
                  try {
                    const res = await fetch(`/api/customer/bookings/${id}/cancel`, { method: 'POST' })
                    const data = await res.json()
                    if (res.ok && data.success) {
                      setShowCancelModal(false)
                      fetchBooking()
                    } else {
                      setCancelError(data.error || 'Failed to cancel booking')
                    }
                  } catch {
                    setCancelError('Network error')
                  } finally {
                    setCancelling(false)
                  }
                }}
                disabled={cancelling}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
