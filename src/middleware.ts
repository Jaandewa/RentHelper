import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth: middleware } = NextAuth(authConfig)

export default middleware((req) => {
  const { pathname } = req.nextUrl

  const protectedRoutes = [
    '/dashboard', '/onboarding', '/admin', '/inventory', '/bookings',
    '/customers', '/calendar', '/invoices', '/settings', '/customer'
  ]

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))

  // /marketplace is PUBLIC — no auth required
  if (!isProtected || pathname.startsWith('/marketplace')) return NextResponse.next()

  // req.auth is populated by NextAuth v5 middleware
  const session = req.auth

  // Not authenticated → redirect to sign in
  if (!session) {
    const url = new URL('/auth/signin', req.url)
    url.searchParams.set('callbackUrl', encodeURI(req.url))
    return NextResponse.redirect(url)
  }

  const role = session.user?.role
  const kycStatus = (session.user as any)?.kycStatus

  // === ADMIN ROUTES: only admins allowed ===
  if (pathname.startsWith('/admin') && role && role !== 'admin') {
    if (role === 'customer') {
      return NextResponse.redirect(new URL('/customer/dashboard', req.url))
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // === ADMIN on wrong pages → send to /admin ===
  if (role === 'admin') {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding') || pathname.startsWith('/customer')) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
  }

  // === CUSTOMERS: role-based routing ===
  if (role === 'customer') {
    // Block provider-only pages
    if (pathname.startsWith('/onboarding/business') || pathname.startsWith('/onboarding/categories')) {
      // Route based on KYC status
      if (kycStatus === 'verified') {
        return NextResponse.redirect(new URL('/customer/dashboard', req.url))
      } else if (kycStatus === 'pending') {
        return NextResponse.redirect(new URL('/customer/pending-approval', req.url))
      } else if (kycStatus === 'rejected' || kycStatus === 'more_info_required') {
        return NextResponse.redirect(new URL('/onboarding/kyc?resubmit=true', req.url))
      }
      return NextResponse.redirect(new URL('/onboarding/kyc', req.url))
    }

    // Block provider dashboard for customers
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/inventory') || pathname.startsWith('/bookings')) {
      if (kycStatus === 'verified') {
        return NextResponse.redirect(new URL('/customer/dashboard', req.url))
      } else if (kycStatus === 'pending') {
        return NextResponse.redirect(new URL('/customer/pending-approval', req.url))
      } else if (kycStatus === 'rejected' || kycStatus === 'more_info_required') {
        return NextResponse.redirect(new URL('/onboarding/kyc?resubmit=true', req.url))
      }
      return NextResponse.redirect(new URL('/onboarding/kyc', req.url))
    }

    // Allow /onboarding/kyc and /customer/* pages
  }

  // === PROVIDERS should not access customer pages ===
  if (role === 'provider') {
    if (pathname.startsWith('/customer/')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
