'use client'

import { signIn, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function getSafeCallbackUrl(rawCallback: string | null): string | null {
  if (!rawCallback) return null
  try {
    const decoded = decodeURIComponent(rawCallback)
    if (decoded.startsWith('/') && !decoded.startsWith('//') && !decoded.startsWith('/auth/')) {
      return decoded
    }
    if (typeof window !== 'undefined') {
      const parsed = new URL(decoded, window.location.origin)
      if (parsed.origin === window.location.origin && !parsed.pathname.startsWith('/auth/')) {
        return parsed.pathname + parsed.search
      }
    }
  } catch {}
  return null
}

function SignInContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(
    searchParams.get('error') === 'OAuthAccountNotLinked'
      ? 'This email is already registered. Please sign in with your password.'
      : ''
  )
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if user is ALREADY authenticated on tab load
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = session.user.role || 'customer'
      const callback = getSafeCallbackUrl(searchParams.get('callbackUrl'))

      if (callback) {
        window.location.href = callback
        return
      }

      if (role === 'admin') {
        window.location.href = '/admin'
      } else if (role === 'provider') {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/customer/dashboard'
      }
    }
  }, [status, session, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    setIsLoading(true)
    setError('')

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('Invalid email or password')
      } else {
        const sessionRes = await fetch('/api/auth/session')
        const sessionData = await sessionRes.json()
        const role = sessionData?.user?.role || 'customer'

        const safeCallback = getSafeCallbackUrl(searchParams.get('callbackUrl'))

        if (safeCallback) {
          window.location.href = safeCallback
          return
        }

        // Role-based destination fallback
        if (role === 'admin') {
          window.location.href = '/admin'
        } else if (role === 'customer') {
          const meRes = await fetch('/api/auth/me')
          const meData = await meRes.json()
          const kycStatus = meData?.user?.customerProfile?.kycStatus
          if (kycStatus === 'verified') {
            window.location.href = '/customer/dashboard'
          } else if (kycStatus === 'pending') {
            window.location.href = '/customer/pending-approval'
          } else if (kycStatus === 'rejected' || kycStatus === 'more_info_required') {
            window.location.href = '/onboarding/kyc?resubmit=true'
          } else {
            window.location.href = '/onboarding/kyc'
          }
        } else {
          window.location.href = '/dashboard'
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100 animate-slideUp motion-reduce:animate-none">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your RentHelper account</p>
        </div>

        <div className="mt-8 space-y-6">
          <button
            onClick={() => signIn('google', { callbackUrl: searchParams.get('callbackUrl') || '/auth/redirect' })}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
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
            {error && (
              <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded-lg border border-red-200 animate-fadeIn motion-reduce:animate-none">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                id="signin-email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-500 transition-colors"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1">
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-sm text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
      <SignInContent />
    </Suspense>
  )
}
