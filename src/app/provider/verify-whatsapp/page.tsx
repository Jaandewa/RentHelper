'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import ContactSupportModal from '@/components/support/ContactSupportModal'

export default function ProviderVerifyWhatsAppPage() {
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'verified'>('idle')
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [maskedPhone, setMaskedPhone] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [expiryCountdown, setExpiryCountdown] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const expiryRef = useRef<NodeJS.Timeout | null>(null)

  // Countdown for resend cooldown
  useEffect(() => {
    if (countdown <= 0) return
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [countdown])

  // Countdown for OTP expiry
  useEffect(() => {
    if (expiryCountdown <= 0) return
    expiryRef.current = setInterval(() => {
      setExpiryCountdown(prev => {
        if (prev <= 1) {
          if (expiryRef.current) clearInterval(expiryRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (expiryRef.current) clearInterval(expiryRef.current) }
  }, [expiryCountdown])

  const handleSendOtp = useCallback(async () => {
    setError('')
    setStep('sending')
    try {
      const res = await fetch('/api/provider/verify-whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: sessionToken || undefined }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send verification code.')
        setStep('idle')
        if (data.resendAvailableInSeconds) setCountdown(data.resendAvailableInSeconds)
        return
      }
      setChallengeId(data.challengeId)
      setSessionToken(data.sessionToken)
      setMaskedPhone(data.maskedPhone)
      setCountdown(data.resendAvailableInSeconds || 60)
      setExpiryCountdown(data.expiresInSeconds || 300)
      setOtp('')
      setStep('sent')
    } catch {
      setError('Network error. Please try again.')
      setStep('idle')
    }
  }, [sessionToken])

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit code.')
      return
    }
    setError('')
    setStep('verifying')
    try {
      const res = await fetch('/api/provider/verify-whatsapp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, otp, sessionToken }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Verification failed.')
        setStep('sent')
        return
      }
      setStep('verified')
      // Session will refresh phoneVerified within 5 minutes.
      // Redirect to dashboard immediately — middleware will re-check.
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    } catch {
      setError('Network error. Please try again.')
      setStep('sent')
    }
  }, [otp, challengeId, sessionToken, router])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Verify Your WhatsApp</h1>
            <p className="text-blue-100 text-sm mt-2">
              We need to verify your WhatsApp number before you can access the dashboard.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Success state */}
            {step === 'verified' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-green-800">Verified Successfully!</h2>
                <p className="text-sm text-gray-600 mt-1">Redirecting to dashboard…</p>
              </div>
            )}

            {/* Idle — send code */}
            {(step === 'idle' || step === 'sending') && (
              <>
                <p className="text-sm text-gray-600">
                  Tap below to receive a 6-digit verification code on your registered WhatsApp number.
                </p>
                <button
                  onClick={handleSendOtp}
                  disabled={step === 'sending'}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {step === 'sending' ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                      </svg>
                      Send Verification Code
                    </>
                  )}
                </button>
              </>
            )}

            {/* OTP entry */}
            {(step === 'sent' || step === 'verifying') && (
              <>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Code sent to <span className="font-mono font-semibold text-gray-800">{maskedPhone}</span>
                  </p>
                  {expiryCountdown > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Expires in {formatTime(expiryCountdown)}
                    </p>
                  )}
                  {expiryCountdown === 0 && step === 'sent' && (
                    <p className="text-xs text-red-600 mt-1">Code expired. Please request a new one.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="otp-input" className="block text-sm font-medium text-gray-700 mb-1">
                    Enter 6-digit code
                  </label>
                  <input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={e => { if (e.key === 'Enter' && otp.length === 6) handleVerifyOtp() }}
                    placeholder="000000"
                    autoFocus
                    className="w-full text-center text-2xl font-mono tracking-[0.5em] border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || step === 'verifying'}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  {step === 'verifying' ? 'Verifying…' : 'Verify Code'}
                </button>

                {/* Resend */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-xs text-gray-500">Resend available in {countdown}s</p>
                  ) : (
                    <button
                      onClick={handleSendOtp}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Footer actions */}
            <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                Need Help? Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>

      <ContactSupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        defaultCategory="WHATSAPP_VERIFICATION_HELP"
        sourcePage="/provider/verify-whatsapp"
      />
    </div>
  )
}
