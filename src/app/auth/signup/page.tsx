'use client'

import { useState, useRef, useCallback, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Building2, Users, CheckCircle, AlertCircle, Loader2, Eye, EyeOff, ChevronDown, Search } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { COUNTRIES, getCountryByCode } from '@/lib/countries'

type OtpState = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified'
type CustomerType = 'LOCAL' | 'FOREIGN'

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

  // Show/hide password state
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Customer-specific state
  const [customerType, setCustomerType] = useState<CustomerType>('LOCAL')
  const [selectedCountryCode, setSelectedCountryCode] = useState('LK')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  // WhatsApp OTP state (customer and provider)
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
  const countryDropdownRef = useRef<HTMLDivElement>(null)
  const countrySearchRef = useRef<HTMLInputElement>(null)

  // Close country dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

  const selectedCountry = useMemo(() => getCountryByCode(selectedCountryCode), [selectedCountryCode])

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES
    const q = countrySearch.toLowerCase()
    return COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [countrySearch])

  // ── Phone validation ────────────────────────────────────────────────
  const isValidPhone = useCallback((phone: string) => {
    if (!phone.trim()) return false
    const cleaned = phone.replace(/[^\d+]/g, '')
    if (role === 'customer' && customerType === 'LOCAL') {
      return /^(\+?94|0)\d{9}$/.test(cleaned)
    }
    if (role === 'customer' && customerType === 'FOREIGN') {
      return /^\d{4,15}$/.test(cleaned)
    }
    // Provider: Sri Lankan only
    return /^(\+?94|0)\d{9}$/.test(cleaned)
  }, [role, customerType])

  // ── Clear OTP state ──────────────────────────────────────────────
  const clearOtpState = useCallback(() => {
    if (otpState !== 'idle') {
      setOtpState('idle')
      setOtpDigits(['', '', '', '', '', ''])
      setChallengeId('')
      setVerificationToken('')
      setMaskedPhone('')
      setOtpError('')
      setResendCountdown(0)
    }
  }, [otpState])

  const handleCustomerTypeChange = (type: CustomerType) => {
    setCustomerType(type)
    if (type === 'LOCAL') {
      setSelectedCountryCode('LK')
    } else {
      setSelectedCountryCode('')
    }
    setWhatsappNumber('')
    clearOtpState()
  }

  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code)
    setShowCountryDropdown(false)
    setCountrySearch('')
    setWhatsappNumber('')
    clearOtpState()
  }

  const handleWhatsappChange = (value: string) => {
    setWhatsappNumber(value)
    setOtpError('')
    if (otpState !== 'idle') clearOtpState()
  }

  // ── Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!isValidPhone(whatsappNumber)) {
      const isLocal = role === 'provider' || (role === 'customer' && customerType === 'LOCAL')
      setOtpError(isLocal
        ? 'Please enter a valid Sri Lankan phone number (e.g. 0771234567)'
        : 'Please enter a valid phone number')
      return
    }

    setOtpState('sending')
    setOtpError('')
    setOtpDigits(['', '', '', '', '', ''])

    try {
      const otpEndpoint = role === 'provider'
        ? '/api/auth/provider-registration/send-whatsapp-otp'
        : '/api/auth/registration/send-whatsapp-otp'

      const body: Record<string, string | undefined> = {
        phoneNumber: whatsappNumber,
        sessionToken: sessionToken || undefined,
      }
      // Send country code for customer foreign numbers
      if (role === 'customer' && customerType === 'FOREIGN' && selectedCountryCode) {
        body.countryCode = selectedCountryCode
      }

      const res = await fetch(otpEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      const verifyEndpoint = role === 'provider'
        ? '/api/auth/provider-registration/verify-whatsapp-otp'
        : '/api/auth/registration/verify-whatsapp-otp'

      const res = await fetch(verifyEndpoint, {
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

    if ((role === 'customer' || role === 'provider') && otpState !== 'verified') {
      setError('Please verify your WhatsApp number first.')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const payload: Record<string, string | null> = { name, email, password, role: role! }
      
      if (role === 'customer' || role === 'provider') {
        payload.whatsappNumber = whatsappNumber
        payload.registrationVerificationToken = verificationToken
      }

      // Customer-specific fields
      if (role === 'customer') {
        payload.customerType = customerType
        const dialCode = customerType === 'LOCAL' ? '94' : (selectedCountry?.dialCode || '94')
        payload.whatsappCountryCode = dialCode
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
    document.cookie = `pendingRole=${role}; path=/; max-age=3600`
    signIn('google', { callbackUrl: '/auth/redirect' })
  }

  const canSubmit = otpState === 'verified'

  // Whether foreign customer has selected a country
  const foreignCountrySelected = customerType === 'FOREIGN' && selectedCountryCode && selectedCountryCode !== ''

  // ── ROLE SELECTION SCREEN ──────────────────────────────────────────
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

  // ── MAIN FORM ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100 animate-slideUp motion-reduce:animate-none">
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
                autoComplete="name"
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
                autoComplete="email"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative mt-1">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative mt-1">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showConfirmPassword}
                  tabIndex={0}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* ── WhatsApp OTP Section ────────────────────────── */}
            {(role === 'customer' || role === 'provider') && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">

                {/* ── LOCAL / FOREIGN SELECTOR (Customer only) ──── */}
                {role === 'customer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
                    <div className="flex gap-3">
                      {(['LOCAL', 'FOREIGN'] as const).map(type => (
                        <label
                          key={type}
                          className={`flex-1 flex items-center gap-2 py-2 px-3 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                            customerType === type
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="customerType"
                            value={type}
                            checked={customerType === type}
                            onChange={() => handleCustomerTypeChange(type)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            customerType === type ? 'border-blue-500' : 'border-gray-300'
                          }`}>
                            {customerType === type && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                          </div>
                          <span className="font-medium">{type === 'LOCAL' ? 'Local Customer' : 'Foreign Customer'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── COUNTRY SELECTOR (Foreign Customer only) ──── */}
                {role === 'customer' && customerType === 'FOREIGN' && (
                  <div ref={countryDropdownRef} className="relative">
                    <label htmlFor="whatsapp-country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <button
                      id="whatsapp-country"
                      type="button"
                      onClick={() => { setShowCountryDropdown(!showCountryDropdown); setTimeout(() => countrySearchRef.current?.focus(), 50) }}
                      disabled={otpState !== 'idle'}
                      className="w-full flex items-center justify-between border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <span>{selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'Select Country...'}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    {showCountryDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-hidden">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                            <input
                              ref={countrySearchRef}
                              type="text"
                              placeholder="Search country..."
                              className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={countrySearch}
                              onChange={e => setCountrySearch(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-40">
                          {filteredCountries.filter(c => c.code !== 'LK').map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => handleCountryChange(c.code)}
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 flex items-center gap-2 ${selectedCountryCode === c.code ? 'bg-blue-50 font-medium' : ''}`}
                            >
                              <span>{c.flag}</span>
                              <span className="flex-1 truncate">{c.name}</span>
                              <span className="text-gray-400 text-xs">+{c.dialCode}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <label htmlFor="whatsapp-number" className="block text-sm font-medium text-gray-700">
                  WhatsApp Number <span className="text-red-500">*</span>
                </label>

                {/* ── VERIFIED STATE ──────────────────────────────── */}
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
                    {/* ── PHONE INPUT + VERIFY BUTTON ──────────────── */}
                    {/* Foreign: disabled until country selected */}
                    {role === 'customer' && customerType === 'FOREIGN' && !foreignCountrySelected ? (
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          disabled
                          placeholder="Select your country to enter WhatsApp number"
                          className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                        />
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="flex items-center px-3 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600 font-medium whitespace-nowrap">
                          +{role === 'customer' && customerType === 'FOREIGN' ? (selectedCountry?.dialCode || '??') : '94'}
                        </div>
                        <input
                          id="whatsapp-number"
                          type="tel"
                          placeholder={role === 'provider' || (role === 'customer' && customerType === 'LOCAL') ? '0771234567' : 'Phone number'}
                          autoComplete="tel"
                          className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          value={whatsappNumber}
                          onChange={e => handleWhatsappChange(e.target.value)}
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
                    )}
                    <p id="whatsapp-help" className="text-xs text-gray-500">
                      {role === 'provider' || (role === 'customer' && customerType === 'LOCAL')
                        ? 'Enter a WhatsApp number in Sri Lankan format, for example 0771234567. We will send a verification code to this number.'
                        : foreignCountrySelected
                          ? 'Enter your national phone number. We will send a verification code via WhatsApp.'
                          : 'Select your country first, then enter your WhatsApp number.'
                      }
                    </p>

                    {/* ── OTP ENTRY ────────────────────────────────── */}
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

                    {/* ── OTP Error ────────────────────────────────── */}
                    {otpError && (
                      <div className="flex items-start gap-1.5 text-sm text-red-600" role="alert" aria-live="assertive">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{otpError}</span>
                      </div>
                    )}
                  </>
                )}

                {/* ── Pre-verification help text ──────────────────── */}
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
            
            {otpState !== 'verified' && (
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
