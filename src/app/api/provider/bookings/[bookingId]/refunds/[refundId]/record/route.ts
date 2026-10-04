import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendRefundProcessedNotification } from '@/lib/notifications/service'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string; refundId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const providerBusiness = await prisma.business.findUnique({
      where: { userId: session.user.id },
    })

    if (!providerBusiness) {
      return NextResponse.json({ error: 'Provider business profile not found' }, { status: 403 })
    }

    const { bookingId, refundId } = await params

    // Scope check: fetch booking strictly within caller business
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        businessId: providerBusiness.id,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or access denied for this business.' },
        { status: 403 }
      )
    }

    // State guard: must be cancelled booking
    if (booking.status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Refund processing is only allowed for cancelled bookings.' },
        { status: 400 }
      )
    }

    // Fetch target refund row
    const refundRow = await prisma.refund.findFirst({
      where: {
        id: refundId,
        bookingId: booking.id,
      },
    })

    if (!refundRow) {
      return NextResponse.json({ error: 'Refund record not found' }, { status: 404 })
    }

    // Idempotent return if already PROCESSED
    if (refundRow.status === 'PROCESSED') {
      return NextResponse.json({
        success: true,
        message: 'Refund has already been processed.',
        refundId: refundRow.id,
        alreadyProcessed: true,
        processedAt: refundRow.processedAt,
        referenceId: refundRow.referenceId,
      })
    }

    // Only PENDING or FAILED can be processed
    if (refundRow.status !== 'PENDING' && refundRow.status !== 'FAILED') {
      return NextResponse.json(
        { error: `Refund cannot be processed from current status (${refundRow.status}).` },
        { status: 400 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { method, referenceId, notes } = body

    const validMethods = ['cash', 'bank_transfer', 'card', 'online']
    if (!method || !validMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Valid payment method required (cash, bank_transfer, card, or online).' },
        { status: 400 }
      )
    }

    if (!referenceId || typeof referenceId !== 'string' || !referenceId.trim()) {
      return NextResponse.json(
        { error: 'A reference or transaction identifier is required to record a refund.' },
        { status: 400 }
      )
    }

    const trimmedReference = referenceId.trim()

    // Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Re-read refund status inside transaction
      const lockedRefund = await tx.refund.findUnique({
        where: { id: refundRow.id },
      })

      if (!lockedRefund) {
        throw new Error('REFUND_NOT_FOUND')
      }

      if (lockedRefund.status === 'PROCESSED') {
        return {
          alreadyProcessed: true,
          processedAt: lockedRefund.processedAt,
          referenceId: lockedRefund.referenceId,
        }
      }

      const now = new Date()

      // 1. Mark Refund PROCESSED
      const updatedRefund = await tx.refund.update({
        where: { id: refundRow.id },
        data: {
          status: 'PROCESSED',
          processedAt: now,
          processedByUserId: session.user.id,
          method,
          referenceId: trimmedReference,
          notes: notes || undefined,
        },
      })

      // 2. Create confirmed Payment record (type = refund)
      const confirmedPayment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: refundRow.amount,
          type: 'refund',
          method,
          reference: trimmedReference,
          notes: notes || `Recorded payout for refund ${refundRow.id}`,
          paidAt: now,
        },
      })

      // 3. Write ActivityLog audit event
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'REFUND_RECORDED',
          entityType: 'REFUND',
          entityId: refundRow.id,
          details: JSON.stringify({
            bookingId: booking.id,
            refundId: refundRow.id,
            amount: refundRow.amount,
            method,
            referenceId: trimmedReference,
            paymentId: confirmedPayment.id,
            originalPaymentId: refundRow.originalPaymentId,
          }),
        },
      })

      return {
        alreadyProcessed: false,
        updatedRefund,
        confirmedPayment,
      }
    })

    if (result.alreadyProcessed) {
      return NextResponse.json({
        success: true,
        message: 'Refund has already been processed.',
        refundId: refundRow.id,
        alreadyProcessed: true,
        processedAt: result.processedAt,
        referenceId: result.referenceId,
      })
    }

    // Trigger notification
    sendRefundProcessedNotification(refundRow.id).catch((e) =>
      console.error('[Record Refund API] Notification error:', e)
    )

    return NextResponse.json({
      success: true,
      message: 'Refund recorded and processed successfully.',
      refundId: refundRow.id,
      amount: refundRow.amount,
      status: 'PROCESSED',
      processedAt: result.updatedRefund?.processedAt || new Date(),
      referenceId: trimmedReference,
    })
  } catch (error: any) {
    console.error('[Record Refund API Error]:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error while recording refund' },
      { status: 500 }
    )
  }
}
