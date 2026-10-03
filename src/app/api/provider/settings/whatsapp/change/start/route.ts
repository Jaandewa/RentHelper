import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import {
  normalizePhoneInternational,
  maskPhoneForDisplay,
} from '@/lib/phone'
import {
  generateOtp,
  hashOtp,
  generateSessionToken,
} from '@/lib/otp'
import { sendRegistrationOtpWhatsApp } from '@/lib/notifications/whatsapp'

const OTP_PURPOSE = 'PROVIDER_CHANGE_WHATSAPP'
const OTP_EXPIRY_MINUTES = 5
const RESEND_COOLDOWN_SECONDS = 60
const MAX_SENDS_PER_15MIN = 3

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || (session.user as any).role !== 'provider') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { newPhone, currentPassword } = body

    if (!newPhone || typeof newPhone !== 'string') {
      return NextResponse.json({ ok: false, error: 'Please enter a valid new phone number.' }, { status: 400 })
    }

    // Require current password for every change start request
    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'We could not verify your current password. Please try again.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { ok: false, error: 'We could not verify your current password. Please try again.' },
        { status: 400 }
      )
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { ok: false, error: 'We could not verify your current password. Please try again.' },
        { status: 400 }
      )
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
      select: { id: true, name: true, normalizedPhone: true },
    })

    if (!business) {
      return NextResponse.json({ ok: false, error: 'Business profile not found.' }, { status: 404 })
    }

    const normalized = normalizePhoneInternational(newPhone, 'LK')
    if (!normalized) {
      return NextResponse.json(
        { ok: false, error: 'Invalid phone number format. Please enter a valid mobile number.' },
        { status: 400 }
      )
    }

    if (business.normalizedPhone === normalized) {
      return NextResponse.json(
        { ok: false, error: 'This number is already your active WhatsApp contact number.' },
        { status: 400 }
      )
    }

    // Generic duplicate check across Business and CustomerProfile
    const existingBusiness = await prisma.business.findFirst({
      where: { normalizedPhone: normalized, id: { not: business.id } },
      select: { id: true },
    })
    const existingCustomer = await prisma.customerProfile.findFirst({
      where: { normalizedPhone: normalized },
      select: { id: true },
    })

    if (existingBusiness || existingCustomer) {
      return NextResponse.json(
        { ok: false, error: 'This number cannot be used. Please try another number.' },
        { status: 400 }
      )
    }

    // Rate limiting: max 3 per 15 minutes
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

    // Resend cooldown: 60 seconds
    const lastChallenge = await prisma.otpChallenge.findFirst({
      where: { phoneNumberNormalized: normalized, purpose: OTP_PURPOSE },
      orderBy: { lastSentAt: 'desc' },
    })

    if (lastChallenge) {
      const elapsed = (Date.now() - lastChallenge.lastSentAt.getTime()) / 1000
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed)
        return NextResponse.json(
          { ok: false, error: `Please wait ${wait} seconds before requesting a new code.`, resendAvailableInSeconds: wait },
          { status: 429 }
        )
      }
    }

    // Invalidate prior active PROVIDER_CHANGE_WHATSAPP challenges for this provider
    const userSessionPrefix = `${session.user.id}:${business.id}`
    await prisma.otpChallenge.updateMany({
      where: {
        purpose: OTP_PURPOSE,
        sessionToken: { startsWith: userSessionPrefix },
        usedAt: null,
      },
      data: { usedAt: new Date() },
    })

    // Issue new challenge
    const otp = generateOtp()
    const otpHashed = await hashOtp(otp)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
    const sessionToken = `${userSessionPrefix}:${generateSessionToken()}`

    const challenge = await prisma.otpChallenge.create({
      data: {
        purpose: OTP_PURPOSE,
        phoneNumber: newPhone,
        phoneNumberNormalized: normalized,
        otpHash: otpHashed,
        expiresAt,
        lastSentAt: new Date(),
        sessionToken,
      },
    })

    // Send WhatsApp OTP
    const sendResult = await sendRegistrationOtpWhatsApp(normalized, {
      customerName: business.name || 'Provider',
      otpCode: otp,
      expiryMinutes: OTP_EXPIRY_MINUTES,
    })

    if (!sendResult.success && !(sendResult as any).skipped) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { usedAt: new Date() },
      }).catch(() => {})

      return NextResponse.json(
        { ok: false, error: 'Unable to send verification code via WhatsApp. Please try again later.' },
        { status: 503 }
      )
    }

    return NextResponse.json({
      ok: true,
      challengeId: challenge.id,
      sessionToken,
      maskedDestination: maskPhoneForDisplay(normalized),
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
      resendAvailableInSeconds: RESEND_COOLDOWN_SECONDS,
    })
  } catch (error) {
    console.error('[Provider WhatsApp Change Start] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
