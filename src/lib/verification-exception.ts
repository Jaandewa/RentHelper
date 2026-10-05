import prisma from '@/lib/prisma'

/**
 * Checks in real-time whether a user has an active, unexpired verification exception.
 * Scoped by userId and targetType. Immediate blocking upon expiry or revocation.
 */
export async function canBypassPhoneVerification(userId: string, targetType: string): Promise<boolean> {
  if (!userId) return false

  const activeException = await prisma.verificationException.findFirst({
    where: {
      userId,
      targetType,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  })

  return Boolean(activeException)
}

/**
 * Grants a temporary verification exception and records notification outbox & audit log.
 */
export async function grantVerificationException({
  userId,
  targetType,
  reason,
  grantedBy,
  durationHours = 24,
}: {
  userId: string
  targetType: string
  reason: string
  grantedBy: string
  durationHours?: number
}) {
  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000)

  // Deactivate existing exceptions for same targetType
  await prisma.verificationException.updateMany({
    where: { userId, targetType, isActive: true },
    data: { isActive: false },
  })

  const exception = await prisma.verificationException.create({
    data: {
      userId,
      targetType,
      exceptionType: 'PHONE_VERIFICATION_BYPASS',
      reason,
      grantedBy,
      expiresAt,
      isActive: true,
    },
  })

  // Write notification outbox row
  await prisma.notificationDelivery.create({
    data: {
      channel: 'email',
      type: 'email',
      recipient: 'security@renthelper.lk',
      recipientUserId: userId,
      recipientType: 'ADMIN',
      eventType: 'VERIFICATION_EXCEPTION_GRANTED',
      status: 'pending',
      nextAttemptAt: new Date(),
      metadata: { exceptionId: exception.id, userId, targetType, reason, expiresAt },
      idempotencyKey: `grant-exception-${exception.id}`,
    },
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: grantedBy,
      action: 'GRANT_VERIFICATION_EXCEPTION',
      entityType: 'User',
      entityId: userId,
      details: JSON.stringify({ reason, exceptionId: exception.id, targetType, expiresAt }),
    },
  })

  return exception
}

/**
 * Revokes an active verification exception immediately and logs outbox & activity log.
 */
export async function revokeVerificationException(
  exceptionId: string,
  revokedBy: string,
  reason: string
) {
  const exception = await prisma.verificationException.update({
    where: { id: exceptionId },
    data: { isActive: false },
  })

  await prisma.notificationDelivery.create({
    data: {
      channel: 'email',
      type: 'email',
      recipient: 'security@renthelper.lk',
      recipientUserId: exception.userId,
      recipientType: 'ADMIN',
      eventType: 'VERIFICATION_EXCEPTION_REVOKED',
      status: 'pending',
      nextAttemptAt: new Date(),
      metadata: { exceptionId: exception.id, userId: exception.userId, reason },
      idempotencyKey: `revoke-exception-${exception.id}`,
    },
  })

  await prisma.activityLog.create({
    data: {
      userId: revokedBy,
      action: 'REVOKE_VERIFICATION_EXCEPTION',
      entityType: 'User',
      entityId: exception.userId,
      details: JSON.stringify({ reason, exceptionId: exception.id, isActive: false }),
    },
  })

  return true
}
