import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isValidOtp, verifyOtp } from '@/lib/otp'
import { maskPhoneForDisplay } from '@/lib/phone'
import { requireAuthenticatedProviderRecoveryAccess } from '@/lib/provider-guard'

const OTP_PURPOSE = 'PROVIDER_CHANGE_WHATSAPP'
const MAX_ATTEMPTS = 5

export async function POST(req: NextRequest) {
  try {
    const { error, user: guardUser, business: guardBusiness } = await requireAuthenticatedProviderRecoveryAccess()
    if (error) return error

    const body = await req.json().catch(() => ({}))
    const { challengeId, sessionToken, code } = body

    if (!challengeId || typeof challengeId !== 'string' || !sessionToken || typeof sessionToken !== 'string') {
      return NextResponse.json({ ok: false, error: 'Invalid request parameters.' }, { status: 400 })
    }

    if (!code || !isValidOtp(code)) {
      return NextResponse.json({ ok: false, error: 'Please enter a valid 6-digit code.' }, { status: 400 })
    }

    const user = guardUser
    const business = guardBusiness

    const expectedPrefix = `${guardUser.id}:${business.id}:`
    if (!sessionToken.startsWith(expectedPrefix)) {
      return NextResponse.json({ ok: false, error: 'Invalid session binding.' }, { status: 400 })
    }

    const challenge = await prisma.otpChallenge.findUnique({
      where: { id: challengeId },
    })

    if (!challenge || challenge.purpose !== OTP_PURPOSE || challenge.sessionToken !== sessionToken) {
      return NextResponse.json({ ok: false, error: 'Verification session not found. Please request a new code.' }, { status: 404 })
    }

    if (challenge.verifiedAt || challenge.usedAt) {
      return NextResponse.json({ ok: false, error: 'This code has already been used. Please request a new code.' }, { status: 400 })
    }

    if (new Date() > challenge.expiresAt) {
      return NextResponse.json({ ok: false, error: 'This code has expired. Please request a new code.' }, { status: 400 })
    }

    if (challenge.attemptCount >= MAX_ATTEMPTS) {
      return NextResponse.json({ ok: false, error: 'Too many incorrect attempts. Please request a new code.' }, { status: 400 })
    }

    // Increment attempt count
    await prisma.otpChallenge.update({
      where: { id: challengeId },
      data: { attemptCount: { increment: 1 } },
    })

    // Verify OTP
    const isMatch = await verifyOtp(code, challenge.otpHash)

    if (!isMatch) {
      const remaining = MAX_ATTEMPTS - (challenge.attemptCount + 1)
      if (remaining <= 0) {
        await prisma.otpChallenge.update({
          where: { id: challengeId },
          data: { usedAt: new Date() },
        }).catch(() => {})
      }

      const errorMessage = remaining > 0
        ? `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Too many incorrect attempts. Please request a new code.'

      return NextResponse.json({ ok: false, error: errorMessage }, { status: 400 })
    }

    const oldNormalizedPhone = business.normalizedPhone
    const newNormalizedPhone = challenge.phoneNumberNormalized
    const newRawPhone = challenge.phoneNumber

    // Execute atomic commit in transaction
    try {
      await prisma.$transaction(async (tx) => {
        // Re-verify business ownership and uniqueness in transaction
        const currentBiz = await tx.business.findUnique({
          where: { id: business.id },
          select: { id: true, normalizedPhone: true },
        })

        if (!currentBiz) {
          throw new Error('BUSINESS_NOT_FOUND')
        }

        if (currentBiz.normalizedPhone === newNormalizedPhone) {
          // Already set to this number
          return
        }

        const existingBiz = await tx.business.findFirst({
          where: { normalizedPhone: newNormalizedPhone, id: { not: business.id } },
          select: { id: true },
        })
        const existingCust = await tx.customerProfile.findFirst({
          where: { normalizedPhone: newNormalizedPhone },
          select: { id: true },
        })

        if (existingBiz || existingCust) {
          throw new Error('DUPLICATE_NUMBER')
        }

        // Update Business active phone
        await tx.business.update({
          where: { id: business.id },
          data: {
            phone: newRawPhone,
            normalizedPhone: newNormalizedPhone,
            phoneVerified: true,
            phoneVerifiedAt: new Date(),
          },
        })

        // Consume current OTP challenge
        await tx.otpChallenge.update({
          where: { id: challengeId },
          data: { verifiedAt: new Date(), usedAt: new Date() },
        })

        // Invalidate all active change challenges for this provider
        await tx.otpChallenge.updateMany({
          where: {
            purpose: OTP_PURPOSE,
            sessionToken: { startsWith: expectedPrefix },
            id: { not: challengeId },
            usedAt: null,
          },
          data: { usedAt: new Date() },
        })

        // Write ActivityLog audit record (NO RAW PHONE NUMBERS!)
        await tx.activityLog.create({
          data: {
            userId: guardUser.id,
            action: 'PROVIDER_WHATSAPP_CHANGED',
            entityType: 'Business',
            entityId: business.id,
            details: JSON.stringify({
              maskedOldPhone: oldNormalizedPhone ? maskPhoneForDisplay(oldNormalizedPhone) : null,
              maskedNewPhone: maskPhoneForDisplay(newNormalizedPhone),
              timestamp: new Date().toISOString(),
            }),
          },
        })
      })
    } catch (err: any) {
      if (err.message === 'DUPLICATE_NUMBER' || err.code === 'P2002') {
        return NextResponse.json(
          { ok: false, error: 'This number cannot be used. Please try another number.' },
          { status: 400 }
        )
      }
      throw err
    }

    // Queue non-blocking outbox security notifications
    try {
      const now = new Date()

      // 1. New number confirmation (WhatsApp)
      await prisma.notificationDelivery.create({
        data: {
          channel: 'whatsapp',
          type: 'whatsapp_text',
          recipient: newNormalizedPhone,
          recipientUserId: guardUser.id,
          recipientType: 'PROVIDER',
          eventType: 'PROVIDER_WHATSAPP_CHANGED',
          status: 'pending',
          nextAttemptAt: now,
          metadata: {
            maskedPhone: maskPhoneForDisplay(newNormalizedPhone),
          },
          idempotencyKey: `whatsapp_changed_new:${business.id}:${Date.now()}`,
        },
      }).catch(() => {})

      // 2. Email security notification (if user has email)
      if (user.email) {
        await prisma.notificationDelivery.create({
          data: {
            channel: 'email',
            type: 'email',
            recipient: user.email,
            recipientUserId: guardUser.id,
            recipientType: 'PROVIDER',
            eventType: 'PROVIDER_WHATSAPP_CHANGED',
            status: 'pending',
            nextAttemptAt: now,
            metadata: {
              providerName: business.name || 'Provider',
              maskedPhone: maskPhoneForDisplay(newNormalizedPhone),
            },
            idempotencyKey: `whatsapp_changed_email:${business.id}:${Date.now()}`,
          },
        }).catch(() => {})
      }

      // 3. Old number WhatsApp alert (if old number exists and differs)
      if (oldNormalizedPhone && oldNormalizedPhone !== newNormalizedPhone) {
        await prisma.notificationDelivery.create({
          data: {
            channel: 'whatsapp',
            type: 'whatsapp_text',
            recipient: oldNormalizedPhone,
            recipientUserId: guardUser.id,
            recipientType: 'PROVIDER',
            eventType: 'PROVIDER_WHATSAPP_CHANGE_SECURITY_ALERT',
            status: 'pending',
            nextAttemptAt: now,
            metadata: {
              maskedOldPhone: maskPhoneForDisplay(oldNormalizedPhone),
            },
            idempotencyKey: `whatsapp_changed_old:${business.id}:${Date.now()}`,
          },
        }).catch(() => {})
      }
    } catch (e) {
      console.error('[Provider WhatsApp Verify] Non-blocking outbox error:', e)
    }

    return NextResponse.json({
      ok: true,
      maskedNewPhone: maskPhoneForDisplay(newNormalizedPhone),
    })
  } catch (error) {
    console.error('[Provider WhatsApp Change Verify] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
