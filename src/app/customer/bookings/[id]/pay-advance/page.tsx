'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, AlertCircle, Clock, CheckCircle } from 'lucide-react'

export default function PayAdvancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const [method, setMethod] = useState('bank_transfer')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/customer/booking-requests/${id}`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to fetch booking')
        }
        const data = await res.json()
        
        if (data.status !== 'awaiting_advance_payment') {
          setError('This booking is not awaiting advance payment.')
        } else {
          setBooking(data)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchBooking()
  }, [id])

  useEffect(() => {
    if (!booking || !booking.holdExpiresAt) return

    const updateTimer = () => {
      const now = new Date().getTime()
      const expiry = new Date(booking.holdExpiresAt).getTime()
      const distance = expiry - now

      if (distance < 0) {
        setTimeLeft('Expired')
        setError('Payment deadline has expired. Please submit a new booking request.')
        return
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)
      setTimeLeft(`${minutes}m ${seconds}s`)
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [booking])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    
    try {
      const res = await fetch(`/api/customer/booking-requests/${id}/pay-advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, reference, notes })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payment failed')
      
      router.push('/customer/dashboard?payment=success')
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>

  if (!booking && error) return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
        <div>{error}</div>
      </div>
      <button className="mt-4 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors" onClick={() => router.push('/customer/dashboard')}>Back to Dashboard</button>
    </div>
  )

  const item = booking.bookingItems?.[0]?.item

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
            <Link href="/customer/bookings" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              My Bookings
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                C
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <h1 className="text-2xl font-bold mb-6">Confirm Advance Payment</h1>
      
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {booking.holdExpiresAt && timeLeft !== 'Expired' && !error && (
        <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-800 flex items-start gap-3">
          <Clock className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Time remaining to pay:</span> {timeLeft}. If not paid, the hold on this item will be released.
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-lg">Booking Summary</h3>
              <p className="text-sm text-gray-500 mt-1">{booking.bookingNumber}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Item</p>
                <p className="font-medium">{item?.name || 'Rental Item'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pickup</p>
                  <p className="font-medium">{formatDate(booking.pickupDate)}</p>
                  <p className="text-xs text-muted-foreground">{booking.pickupTime}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Return</p>
                  <p className="font-medium">{formatDate(booking.returnDate)}</p>
                  <p className="text-xs text-muted-foreground">{booking.returnTime}</p>
                </div>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Rental Total</span>
                  <span>{formatCurrency(booking.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Charge</span>
                  <span>{formatCurrency(booking.deliveryCharge)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Security Deposit</span>
                  <span>{formatCurrency(booking.depositAmount)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total Amount</span>
                  <span>{formatCurrency(booking.totalAmount)}</span>
                </div>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg mt-4 border border-primary/20">
                <div className="flex justify-between font-bold text-lg text-primary">
                  <span>Advance Required</span>
                  <span>{formatCurrency(booking.advanceAmount)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1 text-muted-foreground">
                  <span>Balance Due on Pickup</span>
                  <span>{formatCurrency(booking.totalAmount - booking.advanceAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-lg">Payment Details</h3>
              <p className="text-sm text-gray-500 mt-1">Enter your payment information below</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select 
                    id="method"
                    value={method} 
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="online">Online Wallet / UPI</option>
                    <option value="cash">Cash (if applicable)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">Reference Number (Optional)</label>
                  <input 
                    id="reference" 
                    placeholder="e.g. Transaction ID, Check No."
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea 
                    id="notes" 
                    placeholder="Any additional information..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px]"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <button 
                  type="submit" 
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={submitting || timeLeft === 'Expired' || error !== ''}
                >
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <><CheckCircle className="mr-2 h-4 w-4" /> Confirm Payment of {formatCurrency(booking.advanceAmount)}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
