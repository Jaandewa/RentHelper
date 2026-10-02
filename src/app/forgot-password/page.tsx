'use client'

import { useState } from 'react'
import Link from 'next/link'
import { KeyRound, ArrowLeft, Loader2, CheckCircle, AlertCircle, Mail, MessageCircle, ShieldQuestion } from 'lucide-react'

type Step = 'identifier' | 'choose-channel' | 'sent'

interface Channel {
  id: string
  label: string
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('identifier')
  const [identifier, setIdentifier] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [noOptions, setNoOptions] = useState(false)

  // Step 2 state
  const [channels, setChannels] = useState<Channel[]>([])
  const [recoveryRequestId, setRecoveryRequestId] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)

  // Full state reset
  const resetAll = () => {
    setStep('identifier')
    setIdentifier('')
    setError('')
    setNoOptions(false)
    setChannels([])
    setRecoveryRequestId('')
    setSessionToken('')
    setSelectedChannel(null)
  }

  // ── Step 1: Find account ──────────────────────────────────────────
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || !identifier.trim()) return

    setIsLoading(true)
    setError('')
    setNoOptions(false)

    try {
      const res = await fetch('/api/auth/password-recovery/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          sessionToken: sessionToken || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.')
        return
      }

      if (data.hasRecoveryOptions && data.channels?.length > 0) {
        setChannels(data.channels)
        setRecoveryRequestId(data.recoveryRequestId)
        setSessionToken(data.sessionToken)
        // Pre-select only if exactly one channel
        setSelectedChannel(data.channels.length === 1 ? data.channels[0].id : null)
        setStep('choose-channel')
      } else {
        setNoOptions(true)
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 2: Send reset link ───────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || !selectedChannel) return

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/password-recovery/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoveryRequestId,
          channel: selectedChannel,
          sessionToken,
        }),
      })

      const data = await res.json()

      if (!res.ok && data.message?.includes('expired')) {
        setError('This recovery request has expired. Please start again.')
        return
      }

      setStep('sent')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Helper: parse channel label ───────────────────────────────────
  const parseLabel = (ch: Channel) => {
    // Label format: "Email: d---@gmail.com" or "WhatsApp: +94 71---345"
    const colonIdx = ch.label.indexOf(':')
    if (colonIdx > 0) {
      return ch.label.slice(colonIdx + 1).trim()
    }
    return ch.label
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full animate-slideUp motion-reduce:animate-none">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">

          {/* ── STEP: SENT ─────────────────────────────────────── */}
          {step === 'sent' && (
            <div className="text-center space-y-4 animate-fadeIn motion-reduce:animate-none">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Check your messages</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                If the selected verified contact method is available, password-reset instructions have been sent.
              </p>
              <p className="text-xs text-gray-400">
                Didn&apos;t receive anything? Check your spam folder or try again in a few minutes.
              </p>
              <div className="flex flex-col items-center gap-2 pt-2">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Try another detail
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: CHOOSE CHANNEL ───────────────────────────── */}
          {step === 'choose-channel' && (
            <div className="animate-fadeIn motion-reduce:animate-none">
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <ShieldQuestion className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Account Recovery</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Choose where to receive your password reset link.
                </p>
              </div>

              <form onSubmit={handleSend} className="space-y-5">
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-fadeIn motion-reduce:animate-none" role="alert">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {channels.map((ch) => {
                    const isSelected = selectedChannel === ch.id
                    return (
                      <label
                        key={ch.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="recovery-channel"
                          value={ch.id}
                          checked={isSelected}
                          onChange={() => setSelectedChannel(ch.id)}
                          className="sr-only"
                        />
                        {/* Radio indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'border-blue-500' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          )}
                        </div>
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          ch.id === 'email'
                            ? isSelected ? 'bg-blue-100' : 'bg-gray-100'
                            : isSelected ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {ch.id === 'email' ? (
                            <Mail className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                          ) : (
                            <MessageCircle className={`w-5 h-5 ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
                          )}
                        </div>
                        {/* Label */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {ch.id === 'email' ? 'Email' : 'WhatsApp'}
                          </p>
                          <p className="text-xs text-gray-500 font-mono truncate mt-0.5">
                            {parseLabel(ch)}
                          </p>
                        </div>
                      </label>
                    )
                  })}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !selectedChannel}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending reset link...</>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={resetAll}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Try another detail
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: IDENTIFIER ───────────────────────────────── */}
          {step === 'identifier' && (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <KeyRound className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Forgot Password</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Enter your email address, WhatsApp number, NIC, or passport number.
                </p>
              </div>

              <form onSubmit={handleLookup} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-fadeIn motion-reduce:animate-none" role="alert">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {noOptions && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 animate-fadeIn motion-reduce:animate-none">
                    If an eligible account was found, recovery instructions can be sent using a verified contact method.
                  </div>
                )}

                <div>
                  <label htmlFor="reset-identifier" className="sr-only">
                    Email, WhatsApp number, NIC, or passport number
                  </label>
                  <input
                    id="reset-identifier"
                    type="text"
                    required
                    autoComplete="email"
                    placeholder="Email, WhatsApp number, NIC, or passport number"
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm"
                    value={identifier}
                    onChange={e => { setIdentifier(e.target.value); setNoOptions(false) }}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !identifier.trim()}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Finding account...</>
                  ) : (
                    'Find My Account'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
