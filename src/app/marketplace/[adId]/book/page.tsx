'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { calculateBookingPricing, validateBookingDates, PricingResult } from '@/lib/booking/pricing'

export default function BookNowPage({ params }: { params: Promise<{ adId: string }> }) {
  const router = useRouter()
  const { adId } = use(params)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
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
  const [categorySpecificData, setCategorySpecificData] = useState('{}')

  const [deliveryRequired, setDeliveryRequired] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  
  const [agreementAccepted, setAgreementAccepted] = useState(false)

  const [pricing, setPricing] = useState<PricingResult | null>(null)

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

  useEffect(() => {
    if (pickupDate && returnDate && ad) {
      const validation = validateBookingDates(pickupDate, returnDate)
      if (validation.valid) {
        const p = calculateBookingPricing({
          pickupDate,
          returnDate,
          dailyRate: ad.dailyPrice || ad.item.dailyRate,
          weeklyRate: ad.weeklyPrice || ad.item.weeklyRate,
          monthlyRate: ad.monthlyPrice || ad.item.monthlyRate,
          hourlyRate: ad.hourlyPrice || ad.item.hourlyRate,
          securityDeposit: ad.securityDeposit,
          deliveryCharge: deliveryRequired ? (ad.deliveryRate || 0) : 0,
          setupCharge: 0,
          discount: 0,
          advancePercent: ad.business?.advancePaymentPercent || 30
        })
        setPricing(p)
      } else {
        setPricing(null)
      }
    } else {
      setPricing(null)
    }
  }, [pickupDate, returnDate, ad, deliveryRequired])

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!ad) return <div className="p-8 text-center">Ad not found</div>

  const handleNextStep = () => {
    if (step === 1) {
      const validation = validateBookingDates(pickupDate, returnDate)
      if (!validation.valid) {
        alert(validation.error)
        return
      }
    }
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (!agreementAccepted) {
      alert("You must agree to the terms.")
      return
    }

    setSubmitting(true)
    setError('')

    try {
      let parsedCatData = null
      try {
        parsedCatData = JSON.parse(categorySpecificData)
      } catch (e) {
        // ignore
      }

      const res = await fetch('/api/customer/booking-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId,
          pickupDate,
          returnDate,
          pickupTime,
          returnTime,
          purpose,
          purposeDetails,
          customerNotes,
          deliveryRequired,
          deliveryAddress,
          categorySpecificData: parsedCatData,
          agreementAccepted
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Booking failed')
      } else {
        router.push(`/customer/bookings?status=submitted`)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Request Booking</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Step 1 */}
          {step === 1 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Step 1: Rental Dates</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                  <input
                    type="date"
                    value={pickupDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time (Optional)</label>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                  <input
                    type="date"
                    value={returnDate}
                    min={pickupDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Time (Optional)</label>
                  <input
                    type="time"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleNextStep}
                  disabled={!pickupDate || !returnDate}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Step 2: Purpose & Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Rental</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Personal use">Personal use</option>
                    <option value="Business/corporate">Business/corporate</option>
                    <option value="Event/function">Event/function</option>
                    <option value="Film/photography">Film/photography</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose Details</label>
                  <textarea
                    value={purposeDetails}
                    onChange={(e) => setPurposeDetails(e.target.value)}
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provide a brief description of how you'll use the item"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Notes (Optional)</label>
                  <textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any special requests or notes for the provider?"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Specific Data (JSON Optional)</label>
                  <textarea
                    value={categorySpecificData}
                    onChange={(e) => setCategorySpecificData(e.target.value)}
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-600 px-4 py-2 hover:bg-gray-100 rounded"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Step 3: Delivery Options</h2>
              
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="delivery"
                      checked={!deliveryRequired}
                      onChange={() => setDeliveryRequired(false)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 font-medium">Self-pickup from provider location</span>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryRequired}
                      onChange={() => setDeliveryRequired(true)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 font-medium">Delivery needed</span>
                  </label>
                </div>

                {!deliveryRequired && (
                  <div className="p-4 bg-gray-50 rounded text-sm text-gray-700 border border-gray-200">
                    <p className="font-semibold mb-1">Provider Location:</p>
                    <p>{ad.business?.address || ad.business?.city || 'Address will be provided upon confirmation.'}</p>
                  </div>
                )}

                {deliveryRequired && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={3}
                      required
                      className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter the full delivery address"
                    ></textarea>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="text-gray-600 px-4 py-2 hover:bg-gray-100 rounded"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={deliveryRequired && !deliveryAddress.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Step 4: Agreement</h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm">
                  {error}
                </div>
              )}
              
              <div className="p-4 bg-gray-50 border border-gray-200 rounded mb-6 text-sm text-gray-800">
                <h3 className="font-bold mb-2">Terms and Conditions</h3>
                <p className="mb-2">By submitting this request, you agree to the following:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You will take good care of the rented item(s) and return them in the same condition.</li>
                  <li>You understand that the security deposit may be partially or fully withheld in case of damage.</li>
                  <li>You will pay the required advance amount upon acceptance by the provider to confirm the booking.</li>
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
                  className="text-gray-600 px-4 py-2 hover:bg-gray-100 rounded"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!agreementAccepted || submitting}
                  className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {submitting ? 'Submitting...' : 'Submit Booking Request'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="md:col-span-1">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 sticky top-4">
            <h3 className="font-semibold text-lg border-b pb-3 mb-4">Summary</h3>
            
            <div className="flex items-center gap-3 mb-4">
              {ad.itemImageUrls?.[0] ? (
                <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-100 border">
                  <Image src={ad.itemImageUrls[0]} alt={ad.item.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded bg-gray-100 border flex items-center justify-center text-xs text-gray-400">
                  No Image
                </div>
              )}
              <div>
                <p className="font-medium text-sm line-clamp-2">{ad.item.name}</p>
                <p className="text-xs text-gray-500 mt-1">Provider: {ad.business?.name}</p>
              </div>
            </div>

            {pricing ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Rental ({pricing.rentalDays} days)</span>
                  <span>Rs. {pricing.rentalCharge.toLocaleString()}</span>
                </div>
                
                {pricing.deliveryCharge > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span>Rs. {pricing.deliveryCharge.toLocaleString()}</span>
                  </div>
                )}
                
                {pricing.securityDeposit > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Refundable Deposit</span>
                    <span>Rs. {pricing.securityDeposit.toLocaleString()}</span>
                  </div>
                )}

                <div className="border-t pt-2 mt-2 font-bold flex justify-between">
                  <span>Total Payable</span>
                  <span>Rs. {pricing.totalPayable.toLocaleString()}</span>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-100 text-blue-800 space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>Advance Required</span>
                    <span>Rs. {pricing.advanceRequired.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs opacity-80">
                    <span>Balance Due</span>
                    <span>Rs. {pricing.balanceDue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Select rental dates to see price summary.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
