'use client';

import { useState, useEffect, use, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { calculateBookingPricing, validateBookingDates, PricingResult } from '@/lib/booking/pricing'
import { MapPin, Shield, Clock, Calendar, Package, ChevronLeft, AlertCircle, Store, Tag } from 'lucide-react'

export default function BookNowPage({ params }: { params: Promise<{ adId: string }> }) {
  const router = useRouter()
  const { adId } = use(params)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [dateError, setDateError] = useState('')
  const [ad, setAd] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  const [step, setStep] = useState(1)

  // Form State
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [returnTime, setReturnTime] = useState('')

  const [purpose, setPurpose] = useState('Personal use')
  const [purposeDetails, setPurposeDetails] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')

  const [deliveryRequired, setDeliveryRequired] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  
  const [agreementAccepted, setAgreementAccepted] = useState(false)

  const [pricing, setPricing] = useState<PricingResult | null>(null)

  // Load ad and auth data
  useEffect(() => {
    async function fetchData() {
      try {
        const [adRes, authRes] = await Promise.all([
          fetch(`/api/marketplace/ads/${adId}`),
          fetch('/api/auth/me')
        ])

        if (authRes.status === 401) {
          router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname))
          return
        }

        const authData = await authRes.json()
        if (authData.user?.role !== 'customer') {
          router.push('/')
          return
        }
        
        if (authData.user.customerProfile?.kycStatus !== 'verified') {
          router.push('/onboarding/kyc')
          return
        }

        setUser(authData.user)

        if (!adRes.ok) {
          setError('Ad not found')
        } else {
          const adData = await adRes.json()
          setAd(adData)
        }
      } catch (err) {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [adId, router])

  // Reactive date/time validation and pricing
  useEffect(() => {
    if (!pickupDate || !returnDate) {
      setDateError('')
      setPricing(null)
      return
    }

    const validation = validateBookingDates(pickupDate, returnDate, pickupTime, returnTime)
    if (!validation.valid) {
      setDateError(validation.error || 'Invalid dates')
      setPricing(null)
      return
    }

    setDateError('')

    if (ad) {
      const p = calculateBookingPricing({
        pickupDate,
        returnDate,
        pickupTime,
        returnTime,
        dailyRate: ad.dailyPrice || ad.item?.dailyRate || 0,
        weeklyRate: ad.weeklyPrice || ad.item?.weeklyRate,
        monthlyRate: ad.monthlyPrice || ad.item?.monthlyRate,
        hourlyRate: ad.hourlyPrice || ad.item?.hourlyRate,
        securityDeposit: ad.securityDeposit,
        deliveryCharge: deliveryRequired ? (ad.deliveryRate || 0) : 0,
        setupCharge: 0,
        discount: 0,
        advancePercent: ad.business?.advancePaymentPercent || 30
      })
      setPricing(p)
    }
  }, [pickupDate, returnDate, pickupTime, returnTime, ad, deliveryRequired])

  // Resolve item image from canonical galleryImages or coverImageUrl
  const itemImage = useMemo(() => {
    if (!ad) return null
    const gallery = Array.isArray(ad.galleryImages) ? ad.galleryImages : []
    return gallery[0] || ad.coverImageUrl || null
  }, [ad])

  // Daily rate for display
  const dailyRate = ad ? (ad.dailyPrice || ad.item?.dailyRate || 0) : 0
  const weeklyRate = ad ? (ad.weeklyPrice || ad.item?.weeklyRate) : null
  const monthlyRate = ad ? (ad.monthlyPrice || ad.item?.monthlyRate) : null
  const hourlyRate = ad ? (ad.hourlyPrice || ad.item?.hourlyRate) : null
  const securityDeposit = ad ? (ad.securityDeposit || 0) : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading booking details...</p>
        </div>
      </div>
    )
  }
  if (error && !ad) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-500">{error}</p></div>
  if (!ad) return <div className="min-h-screen flex items-center justify-center"><p>Ad not found</p></div>

  const handleNextStep = () => {
    if (step === 1) {
      if (!pickupDate || !returnDate) return
      const validation = validateBookingDates(pickupDate, returnDate, pickupTime, returnTime)
      if (!validation.valid) {
        setDateError(validation.error || 'Invalid dates')
        return
      }
    }
    if (step === 3 && deliveryRequired && !deliveryAddress.trim()) return
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (!agreementAccepted) {
      setError('You must agree to the terms and conditions.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/customer/booking-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId,
          pickupDate,
          returnDate,
          pickupTime: pickupTime || undefined,
          returnTime: returnTime || undefined,
          purpose,
          purposeDetails,
          customerNotes,
          deliveryRequired,
          deliveryAddress: deliveryRequired ? deliveryAddress : null,
          agreementAccepted,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Booking request failed. Please try again.')
      } else {
        router.push(`/customer/bookings?status=submitted`)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/marketplace/${adId}`)}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to listing
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Request Booking</h1>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-1 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
              s < step ? 'bg-green-500 text-white' :
              s === step ? 'bg-blue-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {s < step ? '✓' : s}
            </div>
            {s < 4 && <div className={`flex-1 h-1 mx-1 rounded ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Rental Dates */}
          {step === 1 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Rental Dates & Times</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
                  <input
                    type="date"
                    value={pickupDate}
                    min={todayStr}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {!pickupTime && <p className="text-xs text-gray-400 mt-1">Defaults to 10:00 AM</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Date *</label>
                  <input
                    type="date"
                    value={returnDate}
                    min={pickupDate || todayStr}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Time</label>
                  <input
                    type="time"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {!returnTime && <p className="text-xs text-gray-400 mt-1">Defaults to 10:00 AM</p>}
                </div>
              </div>

              {/* Inline date/time error */}
              {dateError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{dateError}</p>
                </div>
              )}

              {/* Same-day rental hint */}
              {pickupDate && returnDate && pickupDate === returnDate && !dateError && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                  <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">Same-day rental — charged as 1 day minimum.</p>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleNextStep}
                  disabled={!pickupDate || !returnDate || !!dateError}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Purpose & Details */}
          {step === 2 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-5">
                <Package className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Rental Details</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Rental *</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Personal use">Personal use</option>
                    <option value="Business/corporate">Business/corporate</option>
                    <option value="Event/function">Event/function</option>
                    <option value="Film/photography">Film/photography</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {purpose === 'Other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Please specify *</label>
                    <textarea
                      value={purposeDetails}
                      onChange={(e) => setPurposeDetails(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe how you'll use the item"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes for Provider (Optional)</label>
                  <textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any special requests or notes?"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-600 px-4 py-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={purpose === 'Other' && !purposeDetails.trim()}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Delivery */}
          {step === 3 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Pickup / Delivery</h2>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="delivery"
                    checked={!deliveryRequired}
                    onChange={() => setDeliveryRequired(false)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="font-medium">Self-pickup from provider location</span>
                    {ad.business?.city && (
                      <p className="text-sm text-gray-500 mt-0.5">{ad.business.address || ad.business.city}</p>
                    )}
                  </div>
                </label>
                
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryRequired}
                    onChange={() => setDeliveryRequired(true)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 font-medium">Delivery to my address</span>
                </label>

                {deliveryRequired && (
                  <div className="ml-7 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address *</label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={3}
                      required
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter the full delivery address"
                    />
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="text-gray-600 px-4 py-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={deliveryRequired && !deliveryAddress.trim()}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Agreement & Submit */}
          {step === 4 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-5">
                <Shield className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Review & Submit</h2>
              </div>
              
              {/* Booking summary */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-5 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-gray-600">Item:</span><span className="font-medium">{ad.item?.name || ad.title}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Provider:</span><span className="font-medium">{ad.business?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Pickup:</span><span className="font-medium">{pickupDate} {pickupTime || '10:00'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Return:</span><span className="font-medium">{returnDate} {returnTime || '10:00'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Purpose:</span><span className="font-medium">{purpose}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Delivery:</span><span className="font-medium">{deliveryRequired ? 'Yes' : 'Self-pickup'}</span></div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-5 text-sm text-gray-800">
                <h3 className="font-bold mb-2">Terms and Conditions</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You will take good care of the rented item(s) and return them in the same condition.</li>
                  <li>The security deposit may be partially or fully withheld in case of damage.</li>
                  <li>You will pay the required advance amount upon provider acceptance to confirm the booking.</li>
                  <li>Late returns may incur additional charges as per the provider&apos;s policy.</li>
                </ul>
              </div>

              <label className="flex items-start mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreementAccepted}
                  onChange={(e) => setAgreementAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 rounded border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-700 font-medium">
                  I agree to the rental terms and conditions and promise to return the item on time.
                </span>
              </label>
              
              <div className="flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="text-gray-600 px-4 py-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!agreementAccepted || submitting || !pricing}
                  className="bg-green-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : 'Submit Booking Request'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Item Summary + Pricing */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-4 overflow-hidden">
            {/* Item Image */}
            {itemImage ? (
              <div className="relative w-full aspect-[4/3] bg-gray-100">
                <Image
                  src={itemImage}
                  alt={ad.item?.name || ad.title || 'Item'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>
            ) : (
              <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-300" />
              </div>
            )}

            <div className="p-5 space-y-4">
              {/* Item name + provider */}
              <div>
                <h3 className="font-bold text-lg text-gray-900 line-clamp-2">{ad.item?.name || ad.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  {ad.business?.logo ? (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image src={ad.business.logo} alt={ad.business.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <Store className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-600">{ad.business?.name}</span>
                </div>
              </div>

              {/* Item details */}
              <div className="space-y-2 text-sm border-t pt-3">
                {ad.item?.category?.name && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{ad.item.category.name}</span>
                  </div>
                )}
                {ad.item?.conditionGrade && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Condition: {ad.item.conditionGrade}</span>
                  </div>
                )}
                {(ad.city || ad.business?.city) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{ad.city || ad.business?.city}</span>
                  </div>
                )}
              </div>

              {/* Rates */}
              <div className="space-y-1.5 text-sm border-t pt-3">
                <p className="font-semibold text-gray-800 mb-2">Rates</p>
                {dailyRate > 0 && (
                  <div className="flex justify-between"><span className="text-gray-600">Daily</span><span className="font-medium">Rs. {dailyRate.toLocaleString()}</span></div>
                )}
                {weeklyRate && weeklyRate > 0 && (
                  <div className="flex justify-between"><span className="text-gray-600">Weekly</span><span className="font-medium">Rs. {weeklyRate.toLocaleString()}</span></div>
                )}
                {monthlyRate && monthlyRate > 0 && (
                  <div className="flex justify-between"><span className="text-gray-600">Monthly</span><span className="font-medium">Rs. {monthlyRate.toLocaleString()}</span></div>
                )}
                {securityDeposit > 0 && (
                  <div className="flex justify-between"><span className="text-gray-600">Security Deposit</span><span className="font-medium">Rs. {securityDeposit.toLocaleString()}</span></div>
                )}
              </div>

              {/* Dynamic Pricing */}
              {pricing ? (
                <div className="space-y-2 text-sm border-t pt-3">
                  <p className="font-semibold text-gray-800 mb-2">Price Estimate</p>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>
                      Rental ({pricing.rentalDays} {pricing.rentalDays === 1 ? 'day' : 'days'}
                      {pricing.rentalDays === 1 && pricing.durationHours > 0 && pricing.durationHours < 24
                        ? ` / ${Math.round(pricing.durationHours)}h`
                        : ''
                      })
                    </span>
                    <span>Rs. {pricing.rentalCharge.toLocaleString()}</span>
                  </div>
                  
                  {pricing.deliveryCharge > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery</span>
                      <span>Rs. {pricing.deliveryCharge.toLocaleString()}</span>
                    </div>
                  )}

                  {pricing.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-Rs. {pricing.discount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="border-t pt-2 mt-1 font-bold flex justify-between text-gray-900">
                    <span>Rental Total</span>
                    <span>Rs. {pricing.totalPayable.toLocaleString()}</span>
                  </div>

                  {pricing.securityDeposit > 0 && (
                    <div className="flex justify-between text-gray-600 text-xs">
                      <span>Refundable Deposit</span>
                      <span>Rs. {pricing.securityDeposit.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-1.5">
                    <div className="flex justify-between font-semibold text-blue-900">
                      <span>Advance Required</span>
                      <span>Rs. {pricing.advanceRequired.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-blue-700">
                      <span>Balance Due</span>
                      <span>Rs. {pricing.balanceDue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic border-t pt-3">
                  Select valid rental dates to see pricing.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
