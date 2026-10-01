/**
 * POST /api/auth/registration/verify-whatsapp-otp
 * 
 * Verifies a 6-digit OTP against a challenge.
 * On success, issues a short-lived server-signed registration verification token.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  isValidOtp,
  verifyOtp,
  maskPhone,
  signVerificationToken,
} from '@/lib/otp'

const MAX_ATTEMPTS = 5

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { challengeId, otp, sessionToken } = body

    // ── Validate inputs ───────────────────────────────────────────────
    if (!challengeId || typeof challengeId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid request.' },
        { status: 400 }
      )
    }

    if (!otp || !isValidOtp(otp)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 6-digit code.' },
        { status: 400 }
      )
    }

    if (!sessionToken || typeof sessionToken !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid session.' },
        { status: 400 }
      )
    }

    // ── Load challenge ────────────────────────────────────────────────
    const challenge = await prisma.otpChallenge.findUnique({
      where: { id: challengeId },
    })

    if (!challenge) {
      return NextResponse.json(
        { success: false, error: 'Verification session not found. Please request a new code.' },
        { status: 404 }
      )
    }

    // ── Validate challenge state ──────────────────────────────────────
    
    // Check session binding
    if (challenge.sessionToken !== sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid session. Please request a new code.' },
        { status: 400 }
      )
    }

    // Check purpose
    if (challenge.purpose !== 'REGISTRATION_WHATSAPP') {
      return NextResponse.json(
        { success: false, error: 'Invalid verification type.' },
        { status: 400 }
      )
    }

    // Check already verified/used
    if (challenge.verifiedAt || challenge.usedAt) {
      return NextResponse.json(
        { success: false, error: 'This code has already been used. Please request a new code.' },
        { status: 400 }
      )
    }

    // Check expiry
    if (new Date() > challenge.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'This code has expired. Please request a new code.' },
        { status: 400 }
      )
    }

    // Check attempt limit
    if (challenge.attemptCount >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { success: false, error: 'Too many incorrect attempts. Please request a new code.' },
        { status: 400 }
      )
    }

    // ── Increment attempt count ───────────────────────────────────────
    await prisma.otpChallenge.update({
      where: { id: challengeId },
      data: { attemptCount: { increment: 1 } },
    })

    // ── Verify OTP hash ───────────────────────────────────────────────
    const isMatch = await verifyOtp(otp, challenge.otpHash)

    if (!isMatch) {
      const remaining = MAX_ATTEMPTS - (challenge.attemptCount + 1)
      const message = remaining > 0
        ? `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Too many incorrect attempts. Please request a new code.'
      
      // If this was the last attempt, invalidate the challenge
      if (remaining <= 0) {
        await prisma.otpChallenge.update({
          where: { id: challengeId },
          data: { usedAt: new Date() },
        }).catch(() => {})
      }

      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      )
    }

    // ── OTP matched — sign verification token ─────────────────────────
    const { token, expiresAt } = signVerificationToken(
      challenge.phoneNumberNormalized,
      challengeId
    )

    // Mark challenge as verified atomically
    await prisma.otpChallenge.update({
      where: { id: challengeId },
      data: {
        verifiedAt: new Date(),
        verificationToken: token,
        tokenExpiresAt: expiresAt,
      },
    })

    return NextResponse.json({
      success: true,
      verified: true,
      maskedPhone: maskPhone(challenge.phoneNumberNormalized),
      registrationVerificationToken: token,
    })
  } catch (error) {
    console.error('[Verify OTP] Error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
