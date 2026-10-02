/**
 * POST /api/auth/forgot-password
 * 
 * Initiates password reset flow.
 * Always returns the same generic response to prevent account enumeration.
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import prisma from '@/lib/prisma'
import { sendEmail, buildPasswordResetEmail } from '@/lib/email'

const TOKEN_EXPIRY_MINUTES = 30
const MAX_REQUESTS_PER_EMAIL_15MIN = 3
const MAX_REQUESTS_PER_IP_15MIN = 5

const GENERIC_RESPONSE = {
  success: true,
  message: 'If an account exists for this email address, password-reset instructions have been sent.',
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    // ── Rate limiting ─────────────────────────────────────────────────
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000)

    // Per-email rate limit (check by looking up user first)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (user) {
      const emailResetCount = await prisma.passwordResetToken.count({
        where: {
          userId: user.id,
          createdAt: { gte: fifteenMinAgo },
        },
      })

      if (emailResetCount >= MAX_REQUESTS_PER_EMAIL_15MIN) {
        // Return generic response to avoid enumeration
        return NextResponse.json(GENERIC_RESPONSE)
      }
    }

    // Per-IP rate limit via NotificationDelivery audit trail
    const clientIP = getClientIP(req)
    const ipResetCount = await prisma.notificationDelivery.count({
      where: {
        eventType: 'PASSWORD_RESET_REQUESTED',
        metadata: { path: ['clientIP'], equals: clientIP },
        createdAt: { gte: fifteenMinAgo },
      },
    })

    if (ipResetCount >= MAX_REQUESTS_PER_IP_15MIN) {
      return NextResponse.json(GENERIC_RESPONSE)
    }

    // ── If user doesn't exist, return generic response ────────────────
    if (!user || !user.password) {
      // Log audit for non-existing accounts too (helps with abuse detection)
      await prisma.notificationDelivery.create({
        data: {
          type: 'email',
          eventType: 'PASSWORD_RESET_REQUESTED',
          recipient: normalizedEmail,
          channel: 'email',
          status: 'skipped',
          metadata: { clientIP, reason: 'account_not_found' },
        },
      }).catch(() => {})

      return NextResponse.json(GENERIC_RESPONSE)
    }

    // ── Invalidate prior unused tokens ────────────────────────────────
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    })

    // ── Generate secure reset token ───────────────────────────────────
    const rawToken = randomBytes(32).toString('base64url') // 256 bits
    const tokenHashed = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000)

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: tokenHashed,
        expiresAt,
      },
    })

    // ── Build reset URL ───────────────────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rent.healingcity.lk'
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`

    // ── Send email ────────────────────────────────────────────────────
    const emailContent = buildPasswordResetEmail(resetUrl)
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    })

    // ── Log audit event ───────────────────────────────────────────────
    await prisma.notificationDelivery.create({
      data: {
        type: 'email',
        eventType: 'PASSWORD_RESET_REQUESTED',
        recipient: normalizedEmail,
        recipientUserId: user.id,
        channel: 'email',
        status: emailResult.success ? 'sent' : emailResult.notConfigured ? 'not_configured' : 'failed',
        error: emailResult.error || null,
        sentAt: emailResult.success ? new Date() : null,
        metadata: { clientIP },
      },
    }).catch(() => {})

    return NextResponse.json(GENERIC_RESPONSE)
  } catch (error) {
    console.error('[Forgot Password] Error:', error)
    return NextResponse.json(GENERIC_RESPONSE)
  }
}
