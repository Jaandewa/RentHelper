import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// GET /api/admin/verification-exceptions — list active exceptions
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const exceptions = await prisma.verificationException.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  return NextResponse.json({ exceptions })
}

// POST /api/admin/verification-exceptions — grant temporary exception
export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { userId, targetType, exceptionType, reason, durationHours } = body

  if (!userId || !targetType || !reason || !durationHours) {
    return NextResponse.json({ message: 'userId, targetType, reason, and durationHours are required.' }, { status: 400 })
  }

  if (typeof reason !== 'string' || !reason.trim()) {
    return NextResponse.json({ message: 'Mandatory non-empty reason is required.' }, { status: 400 })
  }

  const hours = Number(durationHours)
  if (isNaN(hours) || hours <= 0 || hours > 720) { // Max 30 days
    return NextResponse.json({ message: 'durationHours must be a positive number up to 720 hours.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  })

  if (!user) {
    return NextResponse.json({ message: 'Target user not found' }, { status: 404 })
  }

  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)

  // Deactivate any existing active exception for this user & targetType
  await prisma.verificationException.updateMany({
    where: { userId, targetType, isActive: true },
    data: { isActive: false },
  })

  // Create new verification exception
  const exception = await prisma.verificationException.create({
    data: {
      userId,
      targetType: targetType.trim(),
      reason: reason.trim(),
      exceptionType: (exceptionType || 'PHONE_VERIFICATION_BYPASS').trim(),
      grantedBy: session!.user.id,
      expiresAt,
      isActive: true,
    },
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session!.user.id,
      action: 'GRANT_VERIFICATION_EXCEPTION',
      entityType: 'VERIFICATION_EXCEPTION',
      entityId: exception.id,
      details: JSON.stringify({
        targetUserId: userId,
        targetType,
        reason: reason.trim(),
        expiresAt,
        durationHours: hours,
      }),
    },
  })

  // Record outbox notification with deterministic idempotency key
  if (user.email) {
    await prisma.notificationDelivery.create({
      data: {
        type: 'email',
        eventType: 'VERIFICATION_EXCEPTION_GRANTED',
        recipient: user.email,
        recipientUserId: userId,
        channel: 'email',
        status: 'pending',
        relatedEntityId: exception.id,
        entityType: 'VERIFICATION_EXCEPTION',
        idempotencyKey: `VERIFICATION_EXCEPTION_GRANTED:${exception.id}:${userId}`,
      },
    }).catch(() => {}) // non-blocking if already exists
  }

  return NextResponse.json({
    exception,
    message: `Temporary ${targetType} exception granted successfully until ${expiresAt.toISOString()}`,
  })
}

// DELETE /api/admin/verification-exceptions — revoke exception
export async function DELETE(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const searchParams = req.nextUrl.searchParams
  const exceptionId = searchParams.get('id')

  if (!exceptionId) {
    return NextResponse.json({ message: 'Exception ID is required' }, { status: 400 })
  }

  const revoked = await prisma.verificationException.update({
    where: { id: exceptionId },
    data: { isActive: false },
  })

  await prisma.activityLog.create({
    data: {
      userId: session!.user.id,
      action: 'REVOKE_VERIFICATION_EXCEPTION',
      entityType: 'VERIFICATION_EXCEPTION',
      entityId: exceptionId,
      details: JSON.stringify({ targetUserId: revoked.userId }),
    },
  })

  // Record outbox notification for revocation with deterministic idempotency key
  await prisma.notificationDelivery.create({
    data: {
      type: 'email',
      eventType: 'VERIFICATION_EXCEPTION_REVOKED',
      recipient: revoked.userId,
      recipientUserId: revoked.userId,
      channel: 'email',
      status: 'pending',
      relatedEntityId: exceptionId,
      entityType: 'VERIFICATION_EXCEPTION',
      idempotencyKey: `VERIFICATION_EXCEPTION_REVOKED:${exceptionId}:${revoked.userId}`,
    },
  }).catch(() => {})

  return NextResponse.json({ message: 'Verification exception revoked successfully' })
}
