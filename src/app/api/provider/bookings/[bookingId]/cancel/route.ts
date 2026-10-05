import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import prisma from '@/lib/prisma'
import { calculateRefundSummary } from '@/lib/booking/cancellation'
import {
  sendBookingCancelledNotificationToCustomer,
  sendBookingCancelledNotificationToProvider,
} from '@/lib/notifications/service'
import { requireVerifiedProviderAccess } from '@/lib/provider-guard'

export const runtime = 'nodejs'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { error, user, business: providerBusiness } = await requireVerifiedProviderAccess()
    if (error) return error

    const { bookingId } = await params

    // Scope check: fetch booking only within caller scope
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        businessId: providerBusiness.id,
      },
      include: {
        payments: true,
        customer: { include: { user: true } },
      },
    })

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Idempotent return if already cancelled
    if (existingBooking.status === 'cancelled') {
      return NextResponse.json({
        success: true,
        message: 'Booking is already cancelled.',
        bookingId: existingBooking.id,
        alreadyCancelled: true,
      })
    }

    // Guard active rentals
    if (existingBooking.status === 'active') {
      return NextResponse.json(
        { error: 'This rental is already active and must be completed through the return process.' },
        { status: 400 }
      )
    }

    const cancellableStatuses = ['awaiting_advance_payment', 'confirmed']

    if (!cancellableStatuses.includes(existingBooking.status)) {
      return NextResponse.json(
        { error: `Provider cannot cancel booking in its current status (${existingBooking.status}).` },
        { status: 400 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const reasonNotes = body?.reason || null

    const cancellationEventId = `evt_${randomBytes(12).toString('hex')}`
    const summary = calculateRefundSummary('PROVIDER', existingBooking)

    // Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Re-read booking inside transaction to guard concurrent race condition
      const lockedBooking = await tx.booking.findUnique({
        where: { id: existingBooking.id },
      })

      if (!lockedBooking) {
        throw new Error('BOOKING_NOT_FOUND')
      }

      if (lockedBooking.status === 'cancelled') {
        return { alreadyCancelled: true }
      }

      // Update booking status (DO NOT mutate paymentStatus)
      await tx.booking.update({
        where: { id: existingBooking.id },
        data: {
          status: 'cancelled',
          notes: reasonNotes
            ? `${existingBooking.notes || ''}\n[Provider Cancel Reason]: ${reasonNotes}`.trim()
            : existingBooking.notes,
        },
      })

      const createdRefunds = []

      // Create Refund records for 100% of eligible rental payments
      for (const item of summary.eligiblePayments) {
        if (item.calculatedRefundAmount > 0) {
          const idempotencyKey = `refund:${existingBooking.id}:${cancellationEventId}:${item.id}:rental`

          const refundRecord = await tx.refund.create({
            data: {
              bookingId: existingBooking.id,
              originalPaymentId: item.id,
              amount: item.calculatedRefundAmount,
              refundType: 'RENTAL_PAYMENT',
              status: 'PENDING',
              reasonCode: summary.policy.reasonCode,
              cancellationEventId,
              idempotencyKey,
              initiatedByUserId: user.id,
            },
          })

          createdRefunds.push(refundRecord)
        }
      }

      // Record ActivityLog audit event
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: 'BOOKING_CANCELLED',
          entityType: 'BOOKING',
          entityId: existingBooking.id,
          details: JSON.stringify({
            actor: 'PROVIDER',
            cancellationEventId,
            reasonCode: summary.policy.reasonCode,
            refundPercentage: 100,
            totalRentalPaid: summary.totalRentalPaid,
            totalRefundCalculated: summary.totalRefundCalculated,
            retainedAmount: 0,
            depositPrepaid: summary.depositPrepaid,
            depositAmount: summary.depositAmount,
            depositManualReviewRequired: summary.depositPrepaid,
            reasonNotes,
          }),
        },
      })

      return {
        alreadyCancelled: false,
        createdRefunds,
      }
    })

    if (result.alreadyCancelled) {
      return NextResponse.json({
        success: true,
        message: 'Booking is already cancelled.',
        bookingId: existingBooking.id,
        alreadyCancelled: true,
      })
    }

    let refundSummaryText = `Provider cancelled booking. Customer is eligible for 100% refund of LKR ${summary.totalRefundCalculated.toLocaleString()}.`
    if (summary.depositPrepaid) {
      refundSummaryText += ' Deposit requires manual review.'
    }

    // Queue notifications
    sendBookingCancelledNotificationToCustomer(
      existingBooking.id,
      cancellationEventId,
      refundSummaryText
    ).catch((e) => console.error('[Provider Cancel API] Customer notification error:', e))

    sendBookingCancelledNotificationToProvider(
      existingBooking.id,
      cancellationEventId,
      'PROVIDER'
    ).catch((e) => console.error('[Provider Cancel API] Provider notification error:', e))

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled by provider.',
      bookingId: existingBooking.id,
      cancellationEventId,
      refundPercentage: 100,
      totalRentalPaid: summary.totalRentalPaid,
      totalRefundCalculated: summary.totalRefundCalculated,
      retainedAmount: 0,
      depositPrepaid: summary.depositPrepaid,
      depositManualReviewNote: summary.depositPrepaid ? 'Deposit collected prior to cancellation — Requires manual review' : null,
      refundsCreatedCount: result.createdRefunds?.length || 0,
    })
  } catch (error: any) {
    console.error('[Provider Booking Cancel API Error]:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error while provider cancelling booking' },
      { status: 500 }
    )
  }
}
