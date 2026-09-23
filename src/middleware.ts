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

  // Admin routes: only admins allowed
  const role = session.user?.role
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
