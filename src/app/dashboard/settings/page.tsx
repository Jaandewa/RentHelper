'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Settings,
  Building2,
  Bell,
  CreditCard,
  Lock,
  Save,
  CheckCircle,
  Phone,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react'
import { maskPhoneForDisplay } from '@/lib/phone'

const TABS = [
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Lock },
]

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()
  const [activeTab, setActiveTab] = useState('business')
  const [isSaving, setIsSaving] = useState(false)
  const [loadingBusiness, setLoadingBusiness] = useState(true)

  const [businessData, setBusinessData] = useState<{
    id?: string
    name?: string
    phone?: string
    normalizedPhone?: string
    phoneVerified?: boolean
  }>({})

  const [businessForm, setBusinessForm] = useState({
    name: 'My Rental Business',
    phone: '',
    address: '123 Main St',
    city: 'Colombo',
    currency: 'LKR',
    timezone: 'Asia/Colombo',
    advancePaymentPercent: '30',
    cancellationPolicy: '',
    depositPolicy: '',
  })

  const [notifications, setNotifications] = useState({
    bookingConfirmation: true,
    pickupReminder: true,
    returnReminder: true,
    overdueAlert: true,
    paymentDue: true,
    kycStatus: true,
    emailChannel: true,
    whatsappChannel: false,
    smsChannel: false,
  })

  // Modal State for Secure WhatsApp Number Change
  const [showModal, setShowModal] = useState(false)
  const [modalStep, setModalStep] = useState<'input' | 'otp' | 'success'>('input')
  const [newPhone, setNewPhone] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [maskedDestination, setMaskedDestination] = useState('')
  const [maskedNewPhone, setMaskedNewPhone] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  const fetchBusinessStatus = async () => {
    try {
      setLoadingBusiness(true)
      const res = await fetch('/api/business/status')
      if (res.ok) {
        const data = await res.json()
        setBusinessData(data)
        if (data.name) {
          setBusinessForm(f => ({
            ...f,
            name: data.name || f.name,
            phone: data.phone || f.phone,
          }))
        }
      }
    } catch (e) {
      console.error('Failed to fetch business status:', e)
    } finally {
      setLoadingBusiness(false)
    }
  }

  useEffect(() => {
    fetchBusinessStatus()
  }, [])

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const openChangeModal = () => {
    setModalStep('input')
    setNewPhone('')
    setCurrentPassword('')
    setOtp('')
    setChallengeId('')
    setSessionToken('')
    setMaskedDestination('')
    setMaskedNewPhone('')
    setModalError(null)
    setModalLoading(false)
    setShowModal(true)
  }

  const closeChangeModal = () => {
    // Clear password, OTP, challenge state immediately
    setCurrentPassword('')
    setOtp('')
    setChallengeId('')
    setSessionToken('')
    setNewPhone('')
    setModalError(null)
    setModalLoading(false)
    setShowModal(false)

    // Call cancel endpoint if challenge was active
    if (challengeId && sessionToken) {
      fetch('/api/provider/settings/whatsapp/change/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, sessionToken }),
      }).catch(() => {})
    }
  }

  const handleStartChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)
    setModalLoading(true)

    try {
      const res = await fetch('/api/provider/settings/whatsapp/change/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPhone, currentPassword }),
      })

      const data = await res.json()
      // Clear password from state right after request
      setCurrentPassword('')

      if (!res.ok || !data.ok) {
        setModalError(data.error || 'Failed to start phone number change.')
        return
      }

      setChallengeId(data.challengeId)
      setSessionToken(data.sessionToken)
      setMaskedDestination(data.maskedDestination)
      setCooldown(data.resendAvailableInSeconds || 60)
      setModalStep('otp')
    } catch (err) {
      setCurrentPassword('')
      setModalError('An unexpected network error occurred. Please try again.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (cooldown > 0 || !challengeId || !sessionToken) return
    setModalError(null)
    setModalLoading(true)

    try {
      const res = await fetch('/api/provider/settings/whatsapp/change/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, sessionToken }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        setModalError(data.error || 'Failed to resend verification code.')
        return
      }

      if (data.challengeId) setChallengeId(data.challengeId)
      if (data.maskedDestination) setMaskedDestination(data.maskedDestination)
      setCooldown(data.resendAvailableInSeconds || 60)
    } catch (err) {
      setModalError('An unexpected network error occurred. Please try again.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)
    setModalLoading(true)

    try {
      const res = await fetch('/api/provider/settings/whatsapp/change/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, sessionToken, code: otp }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        setModalError(data.error || 'Verification failed.')
        return
      }

      // Success! Clear sensitive inputs from state
      setOtp('')
      setMaskedNewPhone(data.maskedNewPhone)
      setModalStep('success')

      // Refresh NextAuth JWT and re-fetch business profile
      await updateSession()
      await fetchBusinessStatus()
    } catch (err) {
      setModalError('An unexpected network error occurred. Please try again.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setIsSaving(false)
    alert('Settings saved!')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your business preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <nav className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {activeTab === 'business' && (
            <div className="space-y-4">
              {/* WhatsApp Contact Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-600" />
                    WhatsApp Contact Number
                  </h2>
                </div>

                <div className="p-4 border border-gray-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Current Verified Number
                      </p>
                      {businessData.phoneVerified ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium px-2 py-0.5 rounded-full">
                          Unverified
                        </span>
                      )}
                    </div>
                    <p className="text-base font-semibold text-gray-900 font-mono mt-1">
                      {businessData.normalizedPhone
                        ? maskPhoneForDisplay(businessData.normalizedPhone)
                        : businessData.phone || 'No WhatsApp number on file'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openChangeModal}
                    className="bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shrink-0 shadow-sm"
                  >
                    Change WhatsApp number
                  </button>
                </div>
              </div>

              {/* Business Profile Form */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Business Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name
                    </label>
                    <input
                      value={businessForm.name}
                      onChange={e =>
                        setBusinessForm(f => ({ ...f, name: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      value={businessForm.city}
                      onChange={e =>
                        setBusinessForm(f => ({ ...f, city: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={businessForm.currency}
                      onChange={e =>
                        setBusinessForm(f => ({ ...f, currency: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="LKR">LKR — Sri Lankan Rupee</option>
                      <option value="USD">USD — US Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="INR">INR — Indian Rupee</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      value={businessForm.address}
                      onChange={e =>
                        setBusinessForm(f => ({ ...f, address: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Advance Payment %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={businessForm.advancePaymentPercent}
                      onChange={e =>
                        setBusinessForm(f => ({
                          ...f,
                          advancePaymentPercent: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cancellation Policy
                    </label>
                    <textarea
                      value={businessForm.cancellationPolicy}
                      rows={3}
                      onChange={e =>
                        setBusinessForm(f => ({
                          ...f,
                          cancellationPolicy: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Describe your cancellation terms..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Events to notify</h3>
                <div className="space-y-3">
                  {[
                    {
                      key: 'bookingConfirmation',
                      label: 'Booking Confirmations',
                      desc: 'When a booking is created or confirmed',
                    },
                    {
                      key: 'pickupReminder',
                      label: 'Pickup Reminders',
                      desc: '24 hours before pickup',
                    },
                    {
                      key: 'returnReminder',
                      label: 'Return Reminders',
                      desc: '24 hours before return date',
                    },
                    {
                      key: 'overdueAlert',
                      label: 'Overdue Alerts',
                      desc: 'When an item is not returned on time',
                    },
                    {
                      key: 'paymentDue',
                      label: 'Payment Due',
                      desc: 'When balance payment is due',
                    },
                    {
                      key: 'kycStatus',
                      label: 'KYC Status Updates',
                      desc: 'When customer KYC is reviewed',
                    },
                  ].map(item => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={(notifications as any)[item.key]}
                          onChange={e =>
                            setNotifications(n => ({
                              ...n,
                              [item.key]: e.target.checked,
                            }))
                          }
                        />
                        <div
                          className={`w-10 h-5 rounded-full transition-colors ${
                            (notifications as any)[item.key] ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              (notifications as any)[item.key]
                                ? 'translate-x-5'
                                : 'translate-x-0.5'
                            }`}
                          />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Channels</h3>
                <div className="space-y-3">
                  {[
                    { key: 'emailChannel', label: 'Email', desc: 'Send notifications via email' },
                    {
                      key: 'whatsappChannel',
                      label: 'WhatsApp',
                      desc: 'Send notifications via WhatsApp',
                    },
                    { key: 'smsChannel', label: 'SMS', desc: 'Send SMS notifications' },
                  ].map(item => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={(notifications as any)[item.key]}
                          onChange={e =>
                            setNotifications(n => ({
                              ...n,
                              [item.key]: e.target.checked,
                            }))
                          }
                        />
                        <div
                          className={`w-10 h-5 rounded-full transition-colors ${
                            (notifications as any)[item.key] ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              (notifications as any)[item.key]
                                ? 'translate-x-5'
                                : 'translate-x-0.5'
                            }`}
                          />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Billing & Plan</h2>
              <div className="border-2 border-blue-500 rounded-xl p-4 bg-blue-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-blue-900 text-lg">Professional Plan</p>
                    <p className="text-sm text-blue-700">
                      Unlimited items, bookings, and customers
                    </p>
                  </div>
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    ACTIVE
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold text-blue-900">
                  Rs. 4,999<span className="text-sm font-normal text-blue-700">/month</span>
                </p>
                <p className="text-xs text-blue-600 mt-1">Next billing: November 1, 2024</p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
              <div className="space-y-3">
                <div className="p-4 border border-gray-200 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Change Password</p>
                    <p className="text-xs text-gray-500">Last changed: Never</p>
                  </div>
                  <button className="text-sm text-blue-600 hover:underline font-medium">
                    Change
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          {(activeTab === 'business' || activeTab === 'notifications') && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change WhatsApp Number Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base">
                  Change WhatsApp Number
                </h3>
              </div>
              <button
                onClick={closeChangeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {modalError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalStep === 'input' && (
                <form onSubmit={handleStartChange} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      New WhatsApp Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +94 77 123 4567"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      A 6-digit verification code will be sent to this number via WhatsApp.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Current Password (Re-authentication)
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required for security to confirm your identity.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeChangeModal}
                      disabled={modalLoading}
                      className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading || !newPhone || !currentPassword}
                      className="flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {modalLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Sending Code...
                        </>
                      ) : (
                        'Send Verification Code'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {modalStep === 'otp' && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      Verification code sent to:
                    </p>
                    <p className="text-base font-bold font-mono text-blue-600">
                      {maskedDestination}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 text-center">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[0.5em] font-mono text-xl border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span>Didn't receive code?</span>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={cooldown > 0 || modalLoading}
                      className="text-blue-600 hover:underline font-semibold disabled:text-gray-400 disabled:no-underline"
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                    </button>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeChangeModal}
                      disabled={modalLoading}
                      className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading || otp.length !== 6}
                      className="flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {modalLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify & Update Number'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {modalStep === 'success' && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 mx-auto flex items-center justify-center">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900">
                      WhatsApp Number Updated!
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Your business contact number has been updated to{' '}
                      <span className="font-mono font-semibold">{maskedNewPhone}</span>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeChangeModal}
                    className="w-full bg-blue-600 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
