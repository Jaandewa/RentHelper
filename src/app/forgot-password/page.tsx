'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ArrowLeft, Loader2, CheckCircle, AlertCircle, Mail, MessageCircle } from 'lucide-react'

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

  // Step 2 state
  const [channels, setChannels] = useState<Channel[]>([])
  const [recoveryRequestId, setRecoveryRequestId] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('')

  // ── Step 1: Find recovery options ─────────────────────────────────
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || !identifier.trim()) return

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/password-recovery/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), sessionToken: sessionToken || undefined }),
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
        setSelectedChannel(data.channels[0].id)
        setStep('choose-channel')
      } else {
        // Generic response — don't reveal whether account exists
        setStep('sent')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 2: Send reset instructions ───────────────────────────────
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

      await res.json()
      setStep('sent')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-slideUp motion-reduce:animate-none">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">

          {/* ── STEP: SENT ─────────────────────────────────────────── */}
          {step === 'sent' && (
            <div className="text-center space-y-4 animate-fadeIn motion-reduce:animate-none">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Check your messages</h2>
              <p className="text-sm text-gray-600">
                If an eligible account was found, password-reset instructions have been sent to the selected verified contact method.
              </p>
              <p className="text-xs text-gray-400">
                Didn&apos;t receive anything? Check your spam folder or try again in a few minutes.
              </p>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500 mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          )}

          {/* ── STEP: CHOOSE CHANNEL ───────────────────────────────── */}
          {step === 'choose-channel' && (
            <div className="animate-fadeIn motion-reduce:animate-none">
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Choose reset delivery</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Select where to receive your password-reset instructions:
                </p>
              </div>

              <form onSubmit={handleSend} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-fadeIn motion-reduce:animate-none" role="alert">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {channels.map((ch) => (
                    <label
                      key={ch.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedChannel === ch.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="channel"
                        value={ch.id}
                        checked={selectedChannel === ch.id}
                        onChange={() => setSelectedChannel(ch.id)}
                        className="sr-only"
                      />
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedChannel === ch.id ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {ch.id === 'email' ? (
                          <Mail className={`w-5 h-5 ${selectedChannel === ch.id ? 'text-blue-600' : 'text-gray-500'}`} />
                        ) : (
                          <MessageCircle className={`w-5 h-5 ${selectedChannel === ch.id ? 'text-green-600' : 'text-gray-500'}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {ch.id === 'email' ? 'Email' : 'WhatsApp'}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{ch.label}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedChannel === ch.id ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        {selectedChannel === ch.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !selectedChannel}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending instructions...</>
                  ) : (
                    'Send Reset Instructions'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => { setStep('identifier'); setError('') }}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Try a different identifier
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: IDENTIFIER ───────────────────────────────────── */}
          {step === 'identifier' && (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Forgot your password?</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Enter the verified email address, WhatsApp number, NIC, or passport number linked to your account.
                </p>
              </div>

              <form onSubmit={handleLookup} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-fadeIn motion-reduce:animate-none" role="alert">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="reset-identifier" className="block text-sm font-medium text-gray-700">
                    Email, WhatsApp number, NIC, or passport number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="reset-identifier"
                    type="text"
                    required
                    autoComplete="email"
                    placeholder="e.g. user@email.com, 0771234567, 200011701807"
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !identifier.trim()}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Looking up account...</>
                  ) : (
                    'Find Recovery Options'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
