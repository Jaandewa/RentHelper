'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react'

function PasswordInput({ 
  id, label, value, onChange, autoComplete = 'new-password', disabled = false, placeholder
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; 
  autoComplete?: string; disabled?: boolean; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          tabIndex={0}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /\d/.test(password) },
  ]
  if (!password) return null
  return (
    <div className="space-y-1 animate-fadeIn motion-reduce:animate-none">
      {checks.map((c, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs">
          <div className={`w-3 h-3 rounded-full flex items-center justify-center ${c.met ? 'bg-green-500' : 'bg-gray-300'}`}>
            {c.met && <CheckCircle className="w-2.5 h-2.5 text-white" />}
          </div>
          <span className={c.met ? 'text-green-700' : 'text-gray-500'}>{c.label}</span>
        </div>
      ))}
    </div>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const isPasswordValid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full animate-slideUp motion-reduce:animate-none">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Invalid Reset Link</h2>
            <p className="text-sm text-gray-600">
              This password reset link is invalid or has expired. Please request a new link.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || !isPasswordValid || !passwordsMatch) return

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/auth/signin'), 3000)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 animate-slideUp motion-reduce:animate-none">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {success ? (
            <div className="text-center space-y-4 animate-fadeIn motion-reduce:animate-none">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Password Reset Successfully</h2>
              <p className="text-sm text-gray-600">
                Your password has been updated. Redirecting to sign in...
              </p>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in now
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Reset your password</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Enter your new password below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-fadeIn motion-reduce:animate-none" role="alert">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <PasswordInput
                  id="new-password"
                  label="New password"
                  value={password}
                  onChange={setPassword}
                  disabled={isLoading}
                  placeholder="Enter new password"
                />

                <PasswordStrength password={password} />

                <PasswordInput
                  id="confirm-password"
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  disabled={isLoading}
                  placeholder="Re-enter new password"
                />

                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-600 animate-fadeIn motion-reduce:animate-none">Passwords do not match.</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !isPasswordValid || !passwordsMatch}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Resetting password...</>
                  ) : (
                    'Reset Password'
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
