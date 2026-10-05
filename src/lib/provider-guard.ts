import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { canBypassPhoneVerification } from '@/lib/verification-exception'

export type ProviderGuardErrorCode =
  | 'UNAUTHENTICATED'
  | 'NOT_PROVIDER'
  | 'ACCOUNT_INACTIVE'
  | 'BUSINESS_MISSING'
  | 'BUSINESS_NOT_APPROVED'
  | 'PHONE_VERIFICATION_REQUIRED'

export interface ProviderContextSuccess {
  ok: true
  session: any
  user: {
    id: string
    email: string | null
    name: string | null
    role: string
    status: string
  }
  business: {
    id: string
    userId: string
    name: string
    slug: string
    phoneVerified: boolean
    approvalStatus: string
    phone?: string | null
    normalizedPhone?: string | null
    city?: string | null
    address?: string | null
  }
  isBypassed: boolean
}

export interface ProviderContextFailure {
  ok: false
  code: ProviderGuardErrorCode
  redirectUrl: string
  session?: any
}

export type ProviderContextResult = ProviderContextSuccess | ProviderContextFailure

export interface ProviderGuardSuccess {
  error: null
  session: any
  user: ProviderContextSuccess['user']
  business: ProviderContextSuccess['business']
  isBypassed: boolean
}

export interface ProviderGuardFailure {
  error: NextResponse
  session: any | null
  user: null
  business: null
  isBypassed: false
}

export type ProviderGuardResult = ProviderGuardSuccess | ProviderGuardFailure

/**
 * Server-only helper to inspect and authorize provider context.
 * Evaluates real-time PostgreSQL user status, business approval, and VerificationException bypasses.
 * Used directly by Server Components (e.g., dashboard layout/pages) for server-side redirects.
 */
export async function getVerifiedProviderContext(): Promise<ProviderContextResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      ok: false,
      code: 'UNAUTHENTICATED',
      redirectUrl: '/auth/signin',
    }
  }

  if (session.user.role !== 'provider') {
    return {
      ok: false,
      code: 'NOT_PROVIDER',
      redirectUrl: '/',
      session,
    }
  }

  // Fetch fresh user state from PostgreSQL
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, status: true },
  })

  if (!dbUser || dbUser.status !== 'active') {
    return {
      ok: false,
      code: 'ACCOUNT_INACTIVE',
      redirectUrl: '/provider/suspended',
      session,
    }
  }

  // Fetch business profile
  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
  })

  if (!business) {
    return {
      ok: false,
      code: 'BUSINESS_MISSING',
      redirectUrl: '/onboarding/business',
      session,
    }
  }

  if (business.approvalStatus?.toLowerCase() === 'rejected') {
    return {
      ok: false,
      code: 'BUSINESS_NOT_APPROVED',
      redirectUrl: '/provider/rejected',
      session,
    }
  }

  if (business.approvalStatus?.toLowerCase() !== 'approved') {
    return {
      ok: false,
      code: 'BUSINESS_NOT_APPROVED',
      redirectUrl: '/onboarding/business',
      session,
    }
  }

  // Check phone verification & real-time exception
  const isBypassed =
    !business.phoneVerified &&
    (await canBypassPhoneVerification(dbUser.id, 'PROVIDER_PHONE'))

  if (!business.phoneVerified && !isBypassed) {
    return {
      ok: false,
      code: 'PHONE_VERIFICATION_REQUIRED',
      redirectUrl: '/provider/verify-whatsapp',
      session,
    }
  }

  return {
    ok: true,
    session,
    user: dbUser,
    business,
    isBypassed,
  }
}

/**
 * Primary Authorization Boundary for Provider API routes.
 * Wraps getVerifiedProviderContext() and converts failure to typed NextResponse (401/403).
 */
export async function requireVerifiedProviderAccess(): Promise<ProviderGuardResult> {
  const ctx = await getVerifiedProviderContext()

  if (!ctx.ok) {
    let status = 403
    let errorMsg = 'Forbidden'

    if (ctx.code === 'UNAUTHENTICATED') {
      status = 401
      errorMsg = 'Unauthorized'
    } else if (ctx.code === 'NOT_PROVIDER') {
      errorMsg = 'Forbidden — provider access required'
    } else if (ctx.code === 'ACCOUNT_INACTIVE') {
      errorMsg = 'Forbidden — account suspended or inactive'
    } else if (ctx.code === 'BUSINESS_MISSING') {
      errorMsg = 'Forbidden — business profile required'
    } else if (ctx.code === 'BUSINESS_NOT_APPROVED') {
      errorMsg = 'Forbidden — business onboarding or approval pending'
    } else if (ctx.code === 'PHONE_VERIFICATION_REQUIRED') {
      errorMsg = 'Phone verification required'
    }

    return {
      error: NextResponse.json(
        { error: errorMsg, code: ctx.code },
        { status }
      ),
      session: ctx.session || null,
      user: null,
      business: null,
      isBypassed: false,
    }
  }

  return {
    error: null,
    session: ctx.session,
    user: ctx.user,
    business: ctx.business,
    isBypassed: ctx.isBypassed,
  }
}

/**
 * Recovery-Only Guard for Provider Phone Verification & WhatsApp Recovery Routes.
 * Enforces authenticated session, provider role, active account status, and business existence.
 * Does NOT require phone verification or active VerificationException.
 */
export async function requireAuthenticatedProviderRecoveryAccess(): Promise<ProviderGuardResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null,
      user: null,
      business: null,
      isBypassed: false,
    }
  }

  if (session.user.role !== 'provider') {
    return {
      error: NextResponse.json({ error: 'Forbidden — provider access required' }, { status: 403 }),
      session,
      user: null,
      business: null,
      isBypassed: false,
    }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, status: true },
  })

  if (!dbUser || dbUser.status !== 'active') {
    return {
      error: NextResponse.json({ error: 'Forbidden — account suspended or inactive', code: 'ACCOUNT_INACTIVE' }, { status: 403 }),
      session,
      user: null,
      business: null,
      isBypassed: false,
    }
  }

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
  })

  if (!business) {
    return {
      error: NextResponse.json({ error: 'Forbidden — business profile required', code: 'BUSINESS_MISSING' }, { status: 403 }),
      session,
      user: null,
      business: null,
      isBypassed: false,
    }
  }

  return {
    error: null,
    session: dbUser ? { user: dbUser } : session,
    user: dbUser,
    business,
    isBypassed: false,
  }
}
