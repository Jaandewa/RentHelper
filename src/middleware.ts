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

  if (!isProtected) return NextResponse.next()

  // req.auth is populated by NextAuth v5 middleware
  const session = req.auth

  // Not authenticated → redirect to sign in
  if (!session) {
    const url = new URL('/auth/signin', req.url)
    url.searchParams.set('callbackUrl', encodeURI(req.url))
    return NextResponse.redirect(url)
  }

  const role = session.user?.role

  // === ADMIN ROUTES: only admins allowed ===
  // Only redirect if role is KNOWN and not admin (avoids loop when role is undefined/stale)
  if (pathname.startsWith('/admin') && role && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // === ADMIN on wrong pages → send to /admin ===
  if (role === 'admin') {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
  }

  // === CUSTOMERS should NOT access provider pages ===
  if (role === 'customer') {
    if (pathname.startsWith('/onboarding/business') || pathname.startsWith('/onboarding/categories')) {
      return NextResponse.redirect(new URL('/onboarding/kyc', req.url))
    }
    // Block provider dashboard for customers
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/inventory') || pathname.startsWith('/bookings')) {
      return NextResponse.redirect(new URL('/customer/pending-approval', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
