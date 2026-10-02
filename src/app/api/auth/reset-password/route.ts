/**
 * POST /api/auth/reset-password
 * 
 * Validates a reset token and updates the user's password.
 * Token is single-use and time-limited.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.'
  if (!/\d/.test(password)) return 'Password must contain at least one number.'
  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, newPassword } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'This password reset link is invalid or has expired. Please request a new link.' },
        { status: 400 }
      )
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { success: false, error: 'New password is required.' },
        { status: 400 }
      )
    }

    // ── Validate password strength ────────────────────────────────────
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      return NextResponse.json(
        { success: false, error: passwordError },
        { status: 400 }
      )
    }

    // ── Find and validate reset token ─────────────────────────────────
    const tokenHashed = hashToken(token)
    
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { tokenHash: tokenHashed },
      include: { user: true },
    })

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: 'This password reset link is invalid or has expired. Please request a new link.' },
        { status: 400 }
      )
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { success: false, error: 'This password reset link has already been used. Please request a new link.' },
        { status: 400 }
      )
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'This password reset link has expired. Please request a new link.' },
        { status: 400 }
      )
    }

    if (!resetToken.user) {
      return NextResponse.json(
        { success: false, error: 'This password reset link is invalid or has expired. Please request a new link.' },
        { status: 400 }
      )
    }

    // ── Update password atomically ────────────────────────────────────
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.$transaction([
      // Update user password and mark password change timestamp
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
        },
      }),
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all other unused tokens for this user
      prisma.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
          id: { not: resetToken.id },
        },
        data: { usedAt: new Date() },
      }),
    ])

    // ── Log audit event ───────────────────────────────────────────────
    await prisma.notificationDelivery.create({
      data: {
        type: 'email',
        eventType: 'PASSWORD_RESET_COMPLETED',
        recipient: resetToken.user.email || '',
        recipientUserId: resetToken.userId,
        channel: 'email',
        status: 'sent',
        sentAt: new Date(),
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    })
  } catch (error) {
    console.error('[Reset Password] Error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
