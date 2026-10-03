/**
 * POST /api/provider/verify-whatsapp/verify
 * 
 * Verifies the OTP for authenticated provider's WhatsApp number.
 * On success: marks Business.phoneVerified = true.
 * Purpose: PROVIDER_LOGIN_WHATSAPP
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isValidOtp, verifyOtp } from '@/lib/otp'

const OTP_PURPOSE = 'PROVIDER_LOGIN_WHATSAPP'
const MAX_ATTEMPTS = 5

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || (session.user as any).role !== 'provider') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { challengeId, otp, sessionToken } = body

    // Validate inputs
    if (!challengeId || typeof challengeId !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 })
    }
    if (!otp || !isValidOtp(otp)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid 6-digit code.' }, { status: 400 })
    }
    if (!sessionToken || typeof sessionToken !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid session.' }, { status: 400 })
    }

    // Load challenge
    const challenge = await prisma.otpChallenge.findUnique({
      where: { id: challengeId },
    })

    if (!challenge) {
      return NextResponse.json(
        { success: false, error: 'Verification session not found. Please request a new code.' },
        { status: 404 }
      )
    }

    // Validate challenge state
    if (challenge.sessionToken !== sessionToken) {
      return NextResponse.json({ success: false, error: 'Invalid session. Please request a new code.' }, { status: 400 })
    }
    if (challenge.purpose !== OTP_PURPOSE) {
      return NextResponse.json({ success: false, error: 'Invalid verification type.' }, { status: 400 })
    }
    if (challenge.verifiedAt || challenge.usedAt) {
      return NextResponse.json({ success: false, error: 'This code has already been used. Please request a new code.' }, { status: 400 })
    }
    if (new Date() > challenge.expiresAt) {
      return NextResponse.json({ success: false, error: 'This code has expired. Please request a new code.' }, { status: 400 })
    }
    if (challenge.attemptCount >= MAX_ATTEMPTS) {
      return NextResponse.json({ success: false, error: 'Too many incorrect attempts. Please request a new code.' }, { status: 400 })
    }

    // Verify provider owns this phone number
    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
      select: { id: true, normalizedPhone: true },
    })

    if (!business || business.normalizedPhone !== challenge.phoneNumberNormalized) {
      return NextResponse.json({ success: false, error: 'Phone number mismatch.' }, { status: 400 })
    }

    // Increment attempt count
    await prisma.otpChallenge.update({
      where: { id: challengeId },
      data: { attemptCount: { increment: 1 } },
    })

    // Verify OTP
    const isMatch = await verifyOtp(otp, challenge.otpHash)

    if (!isMatch) {
      const remaining = MAX_ATTEMPTS - (challenge.attemptCount + 1)
      const message = remaining > 0
        ? `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Too many incorrect attempts. Please request a new code.'

      if (remaining <= 0) {
        await prisma.otpChallenge.update({
          where: { id: challengeId },
          data: { usedAt: new Date() },
        }).catch(() => {})
      }

      return NextResponse.json({ success: false, error: message }, { status: 400 })
    }

    // OTP matched — mark challenge consumed and business verified
    await prisma.$transaction([
      prisma.otpChallenge.update({
        where: { id: challengeId },
        data: { verifiedAt: new Date(), usedAt: new Date() },
      }),
      prisma.business.update({
        where: { id: business.id },
        data: { phoneVerified: true, phoneVerifiedAt: new Date() },
      }),
      // Invalidate all other active challenges for this phone/purpose
      prisma.otpChallenge.updateMany({
        where: {
          phoneNumberNormalized: challenge.phoneNumberNormalized,
          purpose: OTP_PURPOSE,
          id: { not: challengeId },
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'WhatsApp number verified successfully.',
    })
  } catch (error) {
    console.error('[Provider Login Verify OTP] Error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
