import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { maskPhoneForDisplay } from '@/lib/phone'
import { generateOtp, hashOtp } from '@/lib/otp'
import { sendRegistrationOtpWhatsApp } from '@/lib/notifications/whatsapp'
import { requireAuthenticatedProviderRecoveryAccess } from '@/lib/provider-guard'

const OTP_PURPOSE = 'PROVIDER_CHANGE_WHATSAPP'
const OTP_EXPIRY_MINUTES = 5
const RESEND_COOLDOWN_SECONDS = 60
const MAX_SENDS_PER_15MIN = 3

export async function POST(req: NextRequest) {
  try {
    const { error, user: guardUser, business: guardBusiness } = await requireAuthenticatedProviderRecoveryAccess()
    if (error) return error

    const body = await req.json().catch(() => ({}))
    const { challengeId, sessionToken } = body

    if (!challengeId || typeof challengeId !== 'string' || !sessionToken || typeof sessionToken !== 'string') {
      return NextResponse.json({ ok: false, error: 'Invalid change session.' }, { status: 400 })
    }

    const business = guardBusiness

    const expectedPrefix = `${guardUser.id}:${business.id}:`
    if (!sessionToken.startsWith(expectedPrefix)) {
      return NextResponse.json({ ok: false, error: 'Invalid session binding.' }, { status: 400 })
    }

    const priorChallenge = await prisma.otpChallenge.findUnique({
      where: { id: challengeId },
    })

    if (!priorChallenge || priorChallenge.purpose !== OTP_PURPOSE || priorChallenge.sessionToken !== sessionToken) {
      return NextResponse.json({ ok: false, error: 'Pending change request not found. Please start again.' }, { status: 404 })
    }

    const normalized = priorChallenge.phoneNumberNormalized

    // Rate limiting: 15 minutes window
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000)
    const sendCount = await prisma.otpChallenge.count({
      where: {
        phoneNumberNormalized: normalized,
        purpose: OTP_PURPOSE,
        createdAt: { gte: fifteenMinAgo },
      },
    })

    if (sendCount >= MAX_SENDS_PER_15MIN) {
      return NextResponse.json(
        { ok: false, error: 'Too many verification attempts. Please try again in 15 minutes.' },
        { status: 429 }
      )
    }

    // Cooldown check
    const elapsed = (Date.now() - priorChallenge.lastSentAt.getTime()) / 1000
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed)
      return NextResponse.json(
        { ok: false, error: `Please wait ${wait} seconds before requesting a new code.`, resendAvailableInSeconds: wait },
        { status: 429 }
      )
    }

    // Invalidate old active challenge
    await prisma.otpChallenge.update({
      where: { id: challengeId },
      data: { usedAt: new Date() },
    })

    // Issue new challenge for resend
    const otp = generateOtp()
    const otpHashed = await hashOtp(otp)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    const newChallenge = await prisma.otpChallenge.create({
      data: {
        purpose: OTP_PURPOSE,
        phoneNumber: priorChallenge.phoneNumber,
        phoneNumberNormalized: normalized,
        otpHash: otpHashed,
        expiresAt,
        lastSentAt: new Date(),
        sessionToken,
        resendCount: priorChallenge.resendCount + 1,
      },
    })

    const sendResult = await sendRegistrationOtpWhatsApp(normalized, {
      customerName: business.name || 'Provider',
      otpCode: otp,
      expiryMinutes: OTP_EXPIRY_MINUTES,
    })

    if (!sendResult.success && !(sendResult as any).skipped) {
      await prisma.otpChallenge.update({
        where: { id: newChallenge.id },
        data: { usedAt: new Date() },
      }).catch(() => {})

      return NextResponse.json(
        { ok: false, error: 'Unable to send new verification code. Please try again later.' },
        { status: 503 }
      )
    }

    return NextResponse.json({
      ok: true,
      challengeId: newChallenge.id,
      sessionToken,
      maskedDestination: maskPhoneForDisplay(normalized),
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
      resendAvailableInSeconds: RESEND_COOLDOWN_SECONDS,
    })
  } catch (error) {
    console.error('[Provider WhatsApp Change Resend] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
