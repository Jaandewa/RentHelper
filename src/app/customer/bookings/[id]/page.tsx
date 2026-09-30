'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, Package, Calendar, CreditCard, Building2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  pending_provider_approval: 'bg-purple-100 text-purple-800',
  awaiting_advance_payment: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  rejected_by_provider: 'bg-red-100 text-red-800',
  payment_expired: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  pending_provider_approval: 'Awaiting Provider',
  awaiting_advance_payment: 'Pay Advance',
  confirmed: 'Confirmed',
  active: 'Active',
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

  useEffect(() => {
    fetch(`/api/customer/booking-requests/${id}`)
      .then(res => res.json())
      .then(data => {
        setBooking(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

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
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {booking.status === 'awaiting_advance_payment' && (
              <Link href={`/customer/bookings/${id}/pay-advance`} className="block w-full">
                <button className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  Pay Advance
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
