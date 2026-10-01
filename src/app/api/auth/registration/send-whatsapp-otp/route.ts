/**
 * POST /api/auth/registration/send-whatsapp-otp
 * 
 * Sends a 6-digit OTP to a WhatsApp number for customer registration verification.
 * Rate-limited, never returns OTP in response.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  normalizeSriLankanPhone,
  isValidSriLankanPhoneInput,
  generateOtp,
  hashOtp,
  generateSessionToken,
  maskPhone,
} from '@/lib/otp'
import { sendRegistrationOtpWhatsApp } from '@/lib/notifications/whatsapp'

const OTP_EXPIRY_MINUTES = 5
const RESEND_COOLDOWN_SECONDS = 60
const MAX_SENDS_PER_PHONE_15MIN = 3
const MAX_SENDS_PER_SESSION_15MIN = 5

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phoneNumber, sessionToken: clientSessionToken } = body

    // ── Validate phone input ──────────────────────────────────────────
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json(
        { success: false, error: 'WhatsApp number is required.' },
        { status: 400 }
      )
    }

    if (!isValidSriLankanPhoneInput(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid Sri Lankan phone number (e.g. 0771234567).' },
        { status: 400 }
      )
    }

    const normalized = normalizeSriLankanPhone(phoneNumber)
    if (!normalized) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format.' },
        { status: 400 }
      )
    }

    // ── Session token (create or reuse) ───────────────────────────────
    const sessionToken = clientSessionToken || generateSessionToken()

    // ── Rate limiting (DB-based) ──────────────────────────────────────
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000)

    // Check sends per phone in last 15 min
    const phoneSendCount = await prisma.otpChallenge.count({
      where: {
        phoneNumberNormalized: normalized,
        purpose: 'REGISTRATION_WHATSAPP',
        createdAt: { gte: fifteenMinAgo },
      },
    })

    if (phoneSendCount >= MAX_SENDS_PER_PHONE_15MIN) {
      return NextResponse.json(
        { success: false, error: 'Too many verification attempts. Please try again in 15 minutes.' },
        { status: 429 }
      )
    }

    // Check sends per session in last 15 min
    if (clientSessionToken) {
      const sessionSendCount = await prisma.otpChallenge.count({
        where: {
          sessionToken: clientSessionToken,
          purpose: 'REGISTRATION_WHATSAPP',
          createdAt: { gte: fifteenMinAgo },
        },
      })

      if (sessionSendCount >= MAX_SENDS_PER_SESSION_15MIN) {
        return NextResponse.json(
          { success: false, error: 'Too many verification attempts from this session. Please try again later.' },
          { status: 429 }
        )
      }
    }

    // Check resend cooldown — most recent challenge for this phone
    const lastChallenge = await prisma.otpChallenge.findFirst({
      where: {
        phoneNumberNormalized: normalized,
        purpose: 'REGISTRATION_WHATSAPP',
      },
      orderBy: { lastSentAt: 'desc' },
    })

    if (lastChallenge) {
      const secondsSinceLastSend = (Date.now() - lastChallenge.lastSentAt.getTime()) / 1000
      if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
        const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastSend)
        return NextResponse.json(
          {
            success: false,
            error: `Please wait ${waitSeconds} seconds before requesting a new code.`,
            resendAvailableInSeconds: waitSeconds,
          },
          { status: 429 }
        )
      }
    }

    // ── Invalidate previous active challenges for this phone ──────────
    await prisma.otpChallenge.updateMany({
      where: {
        phoneNumberNormalized: normalized,
        purpose: 'REGISTRATION_WHATSAPP',
        usedAt: null,
        verifiedAt: null,
      },
      data: {
        usedAt: new Date(), // Mark as consumed so they can't be used
      },
    })

    // ── Generate OTP ──────────────────────────────────────────────────
    const otp = generateOtp()
    const otpHashed = await hashOtp(otp)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // ── Create challenge record ───────────────────────────────────────
    const challenge = await prisma.otpChallenge.create({
      data: {
        purpose: 'REGISTRATION_WHATSAPP',
        phoneNumber: phoneNumber.trim(),
        phoneNumberNormalized: normalized,
        otpHash: otpHashed,
        expiresAt,
        lastSentAt: new Date(),
        sessionToken,
      },
    })

    // ── Send OTP via WhatsApp ─────────────────────────────────────────
    const sendResult = await sendRegistrationOtpWhatsApp(normalized, {
      customerName: 'Customer',
      otpCode: otp,
      expiryMinutes: OTP_EXPIRY_MINUTES,
    })

    if (!sendResult.success && !(sendResult as any).skipped) {
      // WhatsApp send failed — mark challenge as unusable
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { usedAt: new Date() },
      }).catch(() => {})

      return NextResponse.json(
        { success: false, error: 'Unable to send verification code. Please try again later.' },
        { status: 503 }
      )
    }

    // ── Return safe response ──────────────────────────────────────────
    return NextResponse.json({
      success: true,
      challengeId: challenge.id,
      maskedPhone: maskPhone(normalized),
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
      resendAvailableInSeconds: RESEND_COOLDOWN_SECONDS,
      sessionToken,
    })
  } catch (error) {
    console.error('[Send OTP] Error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
