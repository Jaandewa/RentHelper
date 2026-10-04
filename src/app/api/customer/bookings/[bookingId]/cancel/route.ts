import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { calculateRefundSummary } from '@/lib/booking/cancellation'
import {
  sendBookingCancelledNotificationToCustomer,
  sendBookingCancelledNotificationToProvider,
} from '@/lib/notifications/service'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!customerProfile) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
    }

    const { bookingId } = await params

    // Scope check: fetch booking only within caller scope
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId: customerProfile.id,
      },
      include: {
        payments: true,
        business: true,
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

    const cancellableStatuses = [
      'pending_provider_approval',
      'awaiting_advance_payment',
      'confirmed',
    ]

    if (!cancellableStatuses.includes(existingBooking.status)) {
      return NextResponse.json(
        { error: `Booking cannot be cancelled in its current status (${existingBooking.status}).` },
        { status: 400 }
      )
    }

    const cancellationEventId = `evt_${randomBytes(12).toString('hex')}`

    const summary = calculateRefundSummary('CUSTOMER', existingBooking)

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
        data: { status: 'cancelled' },
      })

      const createdRefunds = []

      // Create Refund records for eligible rental payments
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
              initiatedByUserId: session.user.id,
            },
          })

          createdRefunds.push(refundRecord)
        }
      }

      // Record ActivityLog audit event
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'BOOKING_CANCELLED',
          entityType: 'BOOKING',
          entityId: existingBooking.id,
          details: JSON.stringify({
            actor: 'CUSTOMER',
            cancellationEventId,
            reasonCode: summary.policy.reasonCode,
            refundPercentage: summary.policy.refundPercentage,
            totalRentalPaid: summary.totalRentalPaid,
            totalRefundCalculated: summary.totalRefundCalculated,
            retainedAmount: summary.retainedAmount,
            depositPrepaid: summary.depositPrepaid,
            depositAmount: summary.depositAmount,
            depositManualReviewRequired: summary.depositPrepaid,
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

    // Format customer response
    let refundSummaryText = ''
    if (summary.policy.refundPercentage === 100) {
      refundSummaryText = `Eligible for 100% refund of LKR ${summary.totalRefundCalculated.toLocaleString()}.`
    } else if (summary.policy.refundPercentage === 50) {
      refundSummaryText = `Eligible for 50% refund of LKR ${summary.totalRefundCalculated.toLocaleString()} (LKR ${summary.retainedAmount.toLocaleString()} retained).`
    } else {
      refundSummaryText = `Cancellation is non-refundable (LKR ${summary.retainedAmount.toLocaleString()} retained).`
    }

    if (summary.depositPrepaid) {
      refundSummaryText += ' A security deposit requires separate review.'
    }

    // Queue notifications
    sendBookingCancelledNotificationToCustomer(
      existingBooking.id,
      cancellationEventId,
      refundSummaryText
    ).catch((e) => console.error('[Customer Cancel API] Customer notification error:', e))

    sendBookingCancelledNotificationToProvider(
      existingBooking.id,
      cancellationEventId,
      'CUSTOMER'
    ).catch((e) => console.error('[Customer Cancel API] Provider notification error:', e))

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully.',
      bookingId: existingBooking.id,
      cancellationEventId,
      refundPercentage: summary.policy.refundPercentage,
      totalRentalPaid: summary.totalRentalPaid,
      totalRefundCalculated: summary.totalRefundCalculated,
      retainedAmount: summary.retainedAmount,
      depositPrepaid: summary.depositPrepaid,
      depositMessage: summary.depositPrepaid ? 'A security deposit requires separate review.' : null,
      refundsCreatedCount: result.createdRefunds?.length || 0,
    })
  } catch (error: any) {
    console.error('[Customer Booking Cancel API Error]:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error while cancelling booking' },
      { status: 500 }
    )
  }
}
