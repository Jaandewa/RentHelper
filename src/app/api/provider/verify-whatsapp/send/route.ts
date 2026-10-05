/**
 * POST /api/provider/verify-whatsapp/send
 * 
 * Sends OTP to the authenticated provider's registered WhatsApp number.
 * Purpose: PROVIDER_LOGIN_WHATSAPP (distinct from signup).
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  generateOtp,
  hashOtp,
  generateSessionToken,
  maskPhone,
} from '@/lib/otp'
import { sendRegistrationOtpWhatsApp } from '@/lib/notifications/whatsapp'

const OTP_PURPOSE = 'PROVIDER_LOGIN_WHATSAPP'
const OTP_EXPIRY_MINUTES = 5
const RESEND_COOLDOWN_SECONDS = 60
const MAX_SENDS_PER_PHONE_15MIN = 3

import { requireAuthenticatedProviderRecoveryAccess } from '@/lib/provider-guard'

export async function POST(req: NextRequest) {
  try {
    const { error, user: guardUser, business: guardBusiness } = await requireAuthenticatedProviderRecoveryAccess()
    if (error) return error

    const body = await req.json().catch(() => ({}))
    const { sessionToken: clientSessionToken } = body

    const business = guardBusiness

    // Already verified — no need to send OTP
    if (business.phoneVerified) {
      return NextResponse.json({ success: false, error: 'WhatsApp number is already verified.' }, { status: 400 })
    }

    const normalized = business.normalizedPhone
    if (!normalized) {
      return NextResponse.json({ success: false, error: 'No WhatsApp number on file. Please contact support.' }, { status: 400 })
    }

    const sessionToken = clientSessionToken || generateSessionToken()

    // Rate limiting
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000)
    const phoneSendCount = await prisma.otpChallenge.count({
      where: {
        phoneNumberNormalized: normalized,
        purpose: OTP_PURPOSE,
        createdAt: { gte: fifteenMinAgo },
      },
    })

    if (phoneSendCount >= MAX_SENDS_PER_PHONE_15MIN) {
      return NextResponse.json(
        { success: false, error: 'Too many verification attempts. Please try again in 15 minutes.' },
        { status: 429 }
      )
    }

    // Resend cooldown
    const lastChallenge = await prisma.otpChallenge.findFirst({
      where: { phoneNumberNormalized: normalized, purpose: OTP_PURPOSE },
      orderBy: { lastSentAt: 'desc' },
    })

    if (lastChallenge) {
      const elapsed = (Date.now() - lastChallenge.lastSentAt.getTime()) / 1000
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed)
        return NextResponse.json(
          { success: false, error: `Please wait ${wait} seconds before requesting a new code.`, resendAvailableInSeconds: wait },
          { status: 429 }
        )
      }
    }

    // Invalidate previous challenges
    await prisma.otpChallenge.updateMany({
      where: { phoneNumberNormalized: normalized, purpose: OTP_PURPOSE, usedAt: null, verifiedAt: null },
      data: { usedAt: new Date() },
    })

    // Generate and store
    const otp = generateOtp()
    const otpHashed = await hashOtp(otp)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    const challenge = await prisma.otpChallenge.create({
      data: {
        purpose: OTP_PURPOSE,
        phoneNumber: business.phone || normalized,
        phoneNumberNormalized: normalized,
        otpHash: otpHashed,
        expiresAt,
        lastSentAt: new Date(),
        sessionToken,
      },
    })

    // Send via WhatsApp
    const sendResult = await sendRegistrationOtpWhatsApp(normalized, {
      customerName: 'Provider',
      otpCode: otp,
      expiryMinutes: OTP_EXPIRY_MINUTES,
    })

    if (!sendResult.success && !(sendResult as any).skipped) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { usedAt: new Date() },
      }).catch(() => {})

      return NextResponse.json(
        { success: false, error: 'Unable to send verification code. Please try again later.' },
        { status: 503 }
      )
    }

    return NextResponse.json({
      success: true,
      challengeId: challenge.id,
      maskedPhone: maskPhone(normalized),
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
      resendAvailableInSeconds: RESEND_COOLDOWN_SECONDS,
      sessionToken,
    })
  } catch (error) {
    console.error('[Provider Login Send OTP] Error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
