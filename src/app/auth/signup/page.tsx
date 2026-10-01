'use client'

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Building2, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { signIn } from 'next-auth/react'

type OtpState = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified'

function SignUpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleFromUrl = searchParams.get('role')
  
  const [role, setRole] = useState<'provider' | 'customer' | null>(roleFromUrl as any || null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(
    searchParams.get('error') === 'OAuthAccountNotLinked' 
      ? 'This email is already registered. Please sign in instead.' 
      : ''
  )
  const [isLoading, setIsLoading] = useState(false)

  // WhatsApp OTP state (customer only)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [otpState, setOtpState] = useState<OtpState>('idle')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [challengeId, setChallengeId] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [otpError, setOtpError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCountdown])

  // ── Phone validation ────────────────────────────────────────────────
  const isValidPhone = useCallback((phone: string) => {
    const cleaned = phone.replace(/[^\d+]/g, '')
    return /^(\+?94|0)\d{9}$/.test(cleaned)
  }, [])

  // ── Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!isValidPhone(whatsappNumber)) {
      setOtpError('Please enter a valid Sri Lankan phone number (e.g. 0771234567)')
      return
    }

    setOtpState('sending')
    setOtpError('')
    setOtpDigits(['', '', '', '', '', ''])

    try {
      const res = await fetch('/api/auth/registration/send-whatsapp-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: whatsappNumber,
          sessionToken: sessionToken || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setOtpError(data.error || 'Failed to send verification code.')
        setOtpState('idle')
        if (data.resendAvailableInSeconds) {
          setResendCountdown(data.resendAvailableInSeconds)
        }
        return
      }

      setChallengeId(data.challengeId)
      setSessionToken(data.sessionToken)
      setMaskedPhone(data.maskedPhone)
      setResendCountdown(data.resendAvailableInSeconds || 60)
      setOtpState('sent')

      // Focus first OTP input
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch {
      setOtpError('Network error. Please try again.')
      setOtpState('idle')
    }
  }

  // ── OTP input handling ──────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    // Handle paste of full OTP
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newOtp = [...otpDigits]
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d
      })
      setOtpDigits(newOtp)
      // Focus the input after the last pasted digit
      const nextIndex = Math.min(index + digits.length, 5)
      otpInputRefs.current[nextIndex]?.focus()
      return
    }

    // Single digit
    if (value && !/^\d$/.test(value)) return
    
    const newOtp = [...otpDigits]
    newOtp[index] = value
    setOtpDigits(newOtp)

    // Auto-advance
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  // ── Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const otp = otpDigits.join('')
    if (otp.length !== 6) {
      setOtpError('Please enter all 6 digits.')
      return
    }

    setOtpState('verifying')
    setOtpError('')

    try {
      const res = await fetch('/api/auth/registration/verify-whatsapp-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, otp, sessionToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        setOtpError(data.error || 'Verification failed.')
        setOtpState('sent')
        return
      }

      setVerificationToken(data.registrationVerificationToken)
      setMaskedPhone(data.maskedPhone)
      setOtpState('verified')
    } catch {
      setOtpError('Network error. Please try again.')
      setOtpState('sent')
    }
  }

  // ── Change number ───────────────────────────────────────────────────
  const handleChangeNumber = () => {
    setOtpState('idle')
    setOtpDigits(['', '', '', '', '', ''])
    setChallengeId('')
    setVerificationToken('')
    setMaskedPhone('')
    setOtpError('')
    setResendCountdown(0)
  }

  // ── Submit registration ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (role === 'customer' && otpState !== 'verified') {
      setError('Please verify your WhatsApp number first.')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const payload: Record<string, string> = { name, email, password, role: role! }
      
      if (role === 'customer') {
        payload.whatsappNumber = whatsappNumber
        payload.registrationVerificationToken = verificationToken
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed')
      }
      
      // Auto sign in
      const signInRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (signInRes?.error) {
        throw new Error('Failed to sign in after registration')
      }

      if (role === 'provider') {
        router.push('/onboarding/categories')
      } else {
        router.push('/onboarding/kyc')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = () => {
    // Set a cookie so we know their intended role after OAuth redirect
    document.cookie = `pendingRole=${role}; path=/; max-age=3600`
    // For new users: auth.ts events.createUser will create profiles
    // For existing users: they'll just sign in and go to dashboard
    signIn('google', { callbackUrl: '/auth/redirect' })
  }

  const canSubmit = role === 'customer' ? otpState === 'verified' : true

  if (!role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Join RentHelper</h2>
          <p className="mt-2 text-gray-600">Select how you want to use the platform</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl w-full">
          <button 
            onClick={() => setRole('provider')}
            className="flex flex-col items-center p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Rental Provider</h3>
            <p className="text-gray-500 text-center">I want to list my items and manage my rental business.</p>
          </button>
          
          <button 
            onClick={() => setRole('customer')}
            className="flex flex-col items-center p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Customer</h3>
            <p className="text-gray-500 text-center">I want to rent items from various providers.</p>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create {role === 'provider' ? 'Provider' : 'Customer'} Account
          </h2>
          <button onClick={() => setRole(null)} className="mt-2 text-sm text-blue-600 hover:underline">
            Change account type
          </button>
        </div>

        <div className="mt-8 space-y-6">
          <button
            onClick={handleGoogleSignup}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                id="signup-name"
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                id="signup-email"
                type="email"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                id="signup-confirm-password"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            {/* ── WhatsApp OTP Section (Customer only) ────────────────── */}
            {role === 'customer' && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                <label htmlFor="whatsapp-number" className="block text-sm font-medium text-gray-700">
                  WhatsApp Number <span className="text-red-500">*</span>
                </label>

                {/* ── VERIFIED STATE ──────────────────────────────────── */}
                {otpState === 'verified' ? (
                  <div>
                    <div className="flex items-center gap-2 py-2 px-3 bg-green-50 border border-green-200 rounded-md">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-green-800">
                        {maskedPhone} — Verified
                      </span>
                      <button
                        type="button"
                        onClick={handleChangeNumber}
                        className="ml-auto text-xs text-blue-600 hover:underline"
                      >
                        Change Number
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ── PHONE INPUT + VERIFY BUTTON ──────────────────── */}
                    <div className="flex gap-2">
                      <input
                        id="whatsapp-number"
                        type="tel"
                        placeholder="0771234567"
                        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        value={whatsappNumber}
                        onChange={e => {
                          setWhatsappNumber(e.target.value)
                          setOtpError('')
                        }}
                        disabled={otpState === 'sent' || otpState === 'sending' || otpState === 'verifying'}
                        aria-describedby="whatsapp-help"
                      />
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={!isValidPhone(whatsappNumber) || otpState === 'sending' || (otpState === 'sent' && resendCountdown > 0)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center gap-1.5"
                      >
                        {otpState === 'sending' ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                        ) : otpState === 'sent' ? (
                          resendCountdown > 0 ? `Resend (${resendCountdown}s)` : 'Resend Code'
                        ) : (
                          'Verify Number'
                        )}
                      </button>
                    </div>
                    <p id="whatsapp-help" className="text-xs text-gray-500">
                      Enter a WhatsApp number in Sri Lankan format, for example 0771234567.
                      We will send a verification code to this number.
                    </p>

                    {/* ── OTP ENTRY ────────────────────────────────────── */}
                    {(otpState === 'sent' || otpState === 'verifying') && (
                      <div className="space-y-3 pt-2">
                        <p className="text-sm text-gray-600" aria-live="polite">
                          Verification code sent to <strong>{maskedPhone}</strong>
                        </p>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Enter the 6-digit code
                          </label>
                          <div className="flex gap-2 justify-center" role="group" aria-label="OTP verification code">
                            {otpDigits.map((digit, i) => (
                              <input
                                key={i}
                                ref={el => { otpInputRefs.current[i] = el }}
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={digit}
                                onChange={e => handleOtpChange(i, e.target.value)}
                                onKeyDown={e => handleOtpKeyDown(i, e)}
                                onPaste={e => {
                                  e.preventDefault()
                                  const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                                  if (pasted) handleOtpChange(0, pasted)
                                }}
                                className="w-10 h-12 text-center text-lg font-semibold border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={otpState === 'verifying'}
                                aria-label={`Digit ${i + 1}`}
                              />
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={otpDigits.join('').length !== 6 || otpState === 'verifying'}
                          className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                        >
                          {otpState === 'verifying' ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Verifying code...</>
                          ) : (
                            'Verify OTP'
                          )}
                        </button>
                      </div>
                    )}

                    {/* ── OTP Error ────────────────────────────────────── */}
                    {otpError && (
                      <div className="flex items-start gap-1.5 text-sm text-red-600" role="alert" aria-live="assertive">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{otpError}</span>
                      </div>
                    )}
                  </>
                )}

                {/* ── Pre-verification help text ──────────────────────── */}
                {otpState === 'idle' && (
                  <p className="text-xs text-amber-600 font-medium">
                    Verify your WhatsApp number to continue.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !canSubmit}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 mt-6"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
            
            {role === 'customer' && otpState !== 'verified' && (
              <p className="text-xs text-center text-gray-400">
                Please verify your WhatsApp number to enable account creation.
              </p>
            )}
          </form>

          <div className="text-sm text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpContent />
    </Suspense>
  )
}
