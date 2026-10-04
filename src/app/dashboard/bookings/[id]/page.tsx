'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, X, CreditCard, Calendar, Truck, User, FileText, CheckCircle2, Package, Clock, AlertCircle, Shield, MapPin, Star, Camera, ClipboardCheck, Upload } from 'lucide-react'
import Link from 'next/link'
import { HANDOVER_CONDITIONS, RETURN_CONDITIONS, DEPOSIT_DEDUCTION_REASONS, SETTLEMENT_METHODS } from '@/lib/deposit-deduction-reasons'

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

  // Handover states
  const [showHandoverModal, setShowHandoverModal] = useState(false)
  const [handoverCondition, setHandoverCondition] = useState('')
  const [handoverNotes, setHandoverNotes] = useState('')
  const [handoverProcessing, setHandoverProcessing] = useState(false)
  const [handoverError, setHandoverError] = useState('')

  // Return inspection states
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [returnCondition, setReturnCondition] = useState('')
  const [returnNotes, setReturnNotes] = useState('')
  const [actualReturnDate, setActualReturnDate] = useState(new Date().toISOString().slice(0, 16))
  const [deductionAmount, setDeductionAmount] = useState('0')
  const [deductionReasonCode, setDeductionReasonCode] = useState('NO_DEDUCTION')
  const [deductionReasonText, setDeductionReasonText] = useState('')
  const [settlementMethod, setSettlementMethod] = useState('')
  const [refundReference, setRefundReference] = useState('')
  const [inspectionProcessing, setInspectionProcessing] = useState(false)
  const [inspectionError, setInspectionError] = useState('')

  // Cancellation states
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')

  // Refund payout recording states
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [selectedRefund, setSelectedRefund] = useState<any>(null)
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer')
  const [payoutReference, setPayoutReference] = useState('')
  const [payoutNotes, setPayoutNotes] = useState('')
  const [payoutProcessing, setPayoutProcessing] = useState(false)
  const [payoutError, setPayoutError] = useState('')

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
        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5"
          >
            <X className="w-4 h-4" /> Cancel Booking
          </button>
        </div>
      )}

      {/* Confirmed Status Bar */}
      {booking.status === 'confirmed' && (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900">Booking Confirmed</h3>
              <p className="text-sm text-blue-800 mt-1">
                Customer has paid the advance. This booking is confirmed and the item is reserved.
              </p>
              <button
                onClick={() => setShowHandoverModal(true)}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <ClipboardCheck className="w-4 h-4" /> Mark Item Handed Over
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5"
          >
            <X className="w-4 h-4" /> Cancel Booking
          </button>
        </div>
      )}

      {/* Cancelled Status Bar */}
      {booking.status === 'cancelled' && (
        <div className="bg-gray-100 p-6 rounded-xl border border-gray-300 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <X className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Booking Cancelled</h3>
              <p className="text-sm text-gray-600 mt-1">
                This booking has been cancelled. Review eligible rental payment refunds and recorded payouts below.
              </p>
            </div>
          </div>
          {booking.payments?.some((p: any) => p.type === 'deposit') && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Deposit collected prior to cancellation — Requires manual review</span>
            </div>
          )}
        </div>
      )}

      {/* Active Rental Bar */}
      {booking.status === 'active' && (
        <div className="bg-green-50 p-6 rounded-xl border border-green-200 shadow-sm">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900">Item Handed Over — Active Rental</h3>
              <p className="text-sm text-green-800 mt-1">
                Return due: {new Date(booking.returnDate).toLocaleDateString()}{booking.returnTime ? ` at ${booking.returnTime}` : ''}
              </p>
              <button
                onClick={() => setShowInspectionModal(true)}
                className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <ClipboardCheck className="w-4 h-4" /> Start Return Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Returned Pending Settlement Bar */}
      {booking.status === 'returned_pending_settlement' && (
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-sm">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-900">Item Returned — Pending Inspection</h3>
              <p className="text-sm text-purple-800 mt-1">
                Customer has marked the item as returned. Complete the return inspection and deposit settlement.
              </p>
              <button
                onClick={() => setShowInspectionModal(true)}
                className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <ClipboardCheck className="w-4 h-4" /> Complete Return Inspection
              </button>
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

              {/* Refund financial breakdown */}
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
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[booking.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                Payment: {(booking.paymentStatus || 'unpaid').replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Refund Queue / Management Panel */}
          {booking.refunds && booking.refunds.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" /> Refund Queue & Record Payouts
              </h3>
              <div className="space-y-3">
                {booking.refunds.map((r: any) => (
                  <div key={r.id} className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">Rs. {r.amount?.toLocaleString()}</span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        r.status === 'PROCESSED' ? 'bg-green-100 text-green-800' :
                        r.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        r.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Reason: {r.reasonCode || 'Rental Payment Refund'}</p>
                    {r.referenceId && (
                      <p className="text-xs text-gray-600 font-medium">Reference ID: {r.referenceId}</p>
                    )}
                    {r.processedAt && (
                      <p className="text-xs text-gray-400">Processed: {new Date(r.processedAt).toLocaleString()}</p>
                    )}
                    {(r.status === 'PENDING' || r.status === 'FAILED') && (
                      <button
                        onClick={() => {
                          setSelectedRefund(r)
                          setPayoutReference('')
                          setPayoutNotes('')
                          setPayoutError('')
                          setShowPayoutModal(true)
                        }}
                        className="mt-2 w-full px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition-colors"
                      >
                        Record Payout / Process Refund
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
      {/* HANDOVER MODAL */}
      {showHandoverModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-green-600" /> Confirm Item Handover
            </h3>

            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <p><span className="font-medium">Booking:</span> {booking.bookingNumber}</p>
              <p><span className="font-medium">Customer:</span> {booking.customer?.user?.name}</p>
              <p><span className="font-medium">Item:</span> {booking.bookingItems?.[0]?.item?.name || 'N/A'}</p>
              {booking.depositAmount > 0 && (
                <p><span className="font-medium">Security deposit:</span> Rs. {booking.depositAmount.toLocaleString()}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Item condition at handover <span className="text-red-500">*</span></label>
              <select
                value={handoverCondition}
                onChange={e => { setHandoverCondition(e.target.value); setHandoverError('') }}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">Select condition</option>
                {HANDOVER_CONDITIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Condition notes (optional)</label>
              <textarea
                rows={3}
                maxLength={1000}
                placeholder="Any existing marks, damage, or notes about the item condition..."
                value={handoverNotes}
                onChange={e => setHandoverNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-0.5 text-right">{handoverNotes.length}/1000</p>
            </div>

            {handoverError && <p className="text-sm text-red-600 font-medium">{handoverError}</p>}

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => { setShowHandoverModal(false); setHandoverError(''); setHandoverCondition(''); setHandoverNotes('') }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!handoverCondition) { setHandoverError('Please select a condition.'); return }
                  setHandoverProcessing(true); setHandoverError('')
                  try {
                    const res = await fetch(`/api/provider/bookings/${id}/handover`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ conditionStatus: handoverCondition, notes: handoverNotes.trim() || undefined }),
                    })
                    if (res.ok) { setShowHandoverModal(false); fetchBooking(); setSuccessMsg('Item handed over successfully. Customer has been notified.') }
                    else { const d = await res.json(); setHandoverError(d.error || 'Failed to hand over item') }
                  } catch { setHandoverError('Network error') }
                  setHandoverProcessing(false)
                }}
                disabled={handoverProcessing || !handoverCondition}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {handoverProcessing ? 'Processing...' : 'Confirm Handover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN INSPECTION MODAL */}
      {showInspectionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-purple-600" /> Return Inspection
            </h3>

            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <p><span className="font-medium">Booking:</span> {booking.bookingNumber}</p>
              <p><span className="font-medium">Customer:</span> {booking.customer?.user?.name}</p>
              <p><span className="font-medium">Scheduled return:</span> {new Date(booking.returnDate).toLocaleDateString()}</p>
              {booking.depositAmount > 0 && (
                <p><span className="font-medium">Security deposit:</span> Rs. {booking.depositAmount.toLocaleString()}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Actual return date/time <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                value={actualReturnDate}
                onChange={e => setActualReturnDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Return condition <span className="text-red-500">*</span></label>
              <select
                value={returnCondition}
                onChange={e => { setReturnCondition(e.target.value); setInspectionError('') }}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">Select condition</option>
                {RETURN_CONDITIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Inspection notes <span className="text-red-500">*</span></label>
              <textarea
                rows={3}
                maxLength={1000}
                placeholder="Describe the condition of the returned item..."
                value={returnNotes}
                onChange={e => setReturnNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {booking.depositAmount > 0 && (
              <>
                <hr className="border-gray-200" />
                <h4 className="text-sm font-semibold text-gray-800">Security Deposit Settlement</h4>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Deduction type</label>
                  <select
                    value={deductionReasonCode}
                    onChange={e => { setDeductionReasonCode(e.target.value); if (e.target.value === 'NO_DEDUCTION') setDeductionAmount('0') }}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
                  >
                    {DEPOSIT_DEDUCTION_REASONS.map(r => (
                      <option key={r.code} value={r.code}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {deductionReasonCode !== 'NO_DEDUCTION' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Deduction amount (Rs.)</label>
                      <input
                        type="number"
                        min="0"
                        max={booking.depositAmount}
                        step="0.01"
                        value={deductionAmount}
                        onChange={e => setDeductionAmount(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Deduction reason / explanation <span className="text-red-500">*</span></label>
                      <textarea
                        rows={2}
                        maxLength={500}
                        placeholder="Explain the deduction..."
                        value={deductionReasonText}
                        onChange={e => setDeductionReasonText(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                      />
                    </div>
                  </>
                )}

                <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span>Security deposit:</span><span>Rs. {booking.depositAmount.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Deduction:</span><span className="text-red-600">Rs. {parseFloat(deductionAmount || '0').toLocaleString()}</span></div>
                  <div className="flex justify-between font-semibold border-t border-blue-200 pt-1 mt-1"><span>Refund:</span><span className="text-green-700">Rs. {Math.max(0, booking.depositAmount - parseFloat(deductionAmount || '0')).toLocaleString()}</span></div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Settlement method <span className="text-red-500">*</span></label>
                  <select
                    value={settlementMethod}
                    onChange={e => setSettlementMethod(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
                  >
                    <option value="">Select method</option>
                    {SETTLEMENT_METHODS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {settlementMethod && settlementMethod !== 'NONE' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Settlement reference</label>
                    <input
                      type="text"
                      placeholder="Bank transfer ref, receipt number..."
                      value={refundReference}
                      onChange={e => setRefundReference(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                    />
                  </div>
                )}
              </>
            )}

            {inspectionError && <p className="text-sm text-red-600 font-medium">{inspectionError}</p>}

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => { setShowInspectionModal(false); setInspectionError('') }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!returnCondition) { setInspectionError('Please select return condition.'); return }
                  if (!returnNotes.trim()) { setInspectionError('Please add inspection notes.'); return }
                  if (booking.depositAmount > 0 && !settlementMethod) { setInspectionError('Please select settlement method.'); return }
                  const ded = parseFloat(deductionAmount || '0')
                  if (ded < 0 || ded > booking.depositAmount) { setInspectionError('Invalid deduction amount.'); return }
                  if (ded > 0 && deductionReasonCode === 'NO_DEDUCTION') { setInspectionError('Select a deduction reason.'); return }
                  if (ded > 0 && !deductionReasonText.trim()) { setInspectionError('Deduction explanation required.'); return }
                  setInspectionProcessing(true); setInspectionError('')
                  try {
                    const res = await fetch(`/api/provider/bookings/${id}/return-inspection`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        conditionStatus: returnCondition,
                        notes: returnNotes.trim(),
                        actualReturnDate: new Date(actualReturnDate).toISOString(),
                        deductionAmount: ded,
                        deductionReasonCode: ded > 0 ? deductionReasonCode : 'NO_DEDUCTION',
                        deductionReasonText: ded > 0 ? deductionReasonText.trim() : undefined,
                        settlementMethod: booking.depositAmount > 0 ? settlementMethod : 'NONE',
                        refundReference: refundReference.trim() || undefined,
                      }),
                    })
                    if (res.ok) { setShowInspectionModal(false); fetchBooking(); setSuccessMsg('Return inspection completed. Customer has been notified.') }
                    else { const d = await res.json(); setInspectionError(d.error || 'Failed to complete inspection') }
                  } catch { setInspectionError('Network error') }
                  setInspectionProcessing(false)
                }}
                disabled={inspectionProcessing || !returnCondition}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inspectionProcessing ? 'Processing...' : 'Complete Return Inspection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provider Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Cancel Booking #{booking.bookingNumber}?</h3>
            <p className="text-sm text-gray-600">
              Provider cancellation will mark this booking as cancelled and entitle the customer to a <strong>100% refund</strong> of all rental payments paid.
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reason for Cancellation (optional)</label>
              <textarea
                rows={3}
                placeholder="Reason for cancelling..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
              />
            </div>

            {cancelError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{cancelError}</div>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowCancelModal(false); setCancelError('') }}
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
                    const res = await fetch(`/api/provider/bookings/${id}/cancel`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reason: cancelReason.trim() || undefined }),
                    })
                    const data = await res.json()
                    if (res.ok && data.success) {
                      setShowCancelModal(false)
                      fetchBooking()
                      setSuccessMsg('Booking cancelled by provider. Customer notified.')
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
                {cancelling ? 'Cancelling...' : 'Confirm Provider Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Recording Modal */}
      {showPayoutModal && selectedRefund && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              Record Payout for Refund (Rs. {selectedRefund.amount?.toLocaleString()})
            </h3>
            <p className="text-xs text-gray-500">
              Approved refund amount is fixed at LKR {selectedRefund.amount?.toLocaleString()}. Please enter the payout transaction reference.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  value={payoutMethod}
                  onChange={e => setPayoutMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Reference / Receipt ID *</label>
                <input
                  type="text"
                  placeholder="Bank ref, cheque no., or receipt identifier..."
                  value={payoutReference}
                  onChange={e => setPayoutReference(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  placeholder="Additional payout notes..."
                  value={payoutNotes}
                  onChange={e => setPayoutNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                />
              </div>
            </div>

            {payoutError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{payoutError}</div>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowPayoutModal(false); setPayoutError('') }}
                disabled={payoutProcessing}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!payoutReference.trim()) {
                    setPayoutError('Transaction reference / receipt identifier is required.')
                    return
                  }
                  setPayoutProcessing(true)
                  setPayoutError('')
                  try {
                    const res = await fetch(`/api/provider/bookings/${id}/refunds/${selectedRefund.id}/record`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        method: payoutMethod,
                        referenceId: payoutReference.trim(),
                        notes: payoutNotes.trim() || undefined,
                      }),
                    })
                    const data = await res.json()
                    if (res.ok && data.success) {
                      setShowPayoutModal(false)
                      fetchBooking()
                      setSuccessMsg('Refund payout recorded successfully. Customer notified.')
                    } else {
                      setPayoutError(data.error || 'Failed to record refund payout')
                    }
                  } catch {
                    setPayoutError('Network error')
                  } finally {
                    setPayoutProcessing(false)
                  }
                }}
                disabled={payoutProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {payoutProcessing ? 'Recording...' : 'Record Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
