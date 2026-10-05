import { requireVerifiedProviderAccess } from '@/lib/provider-guard'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { queueEventNotifications } from '@/lib/notifications/service'
import { VALID_DEDUCTION_CODES } from '@/lib/deposit-deduction-reasons'

export const runtime = 'nodejs'

export async function POST(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { error, user, business } = await requireVerifiedProviderAccess()
    if (error) return error

    const { bookingId } = await params

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: true,
        customer: { include: { user: true } },
        bookingItems: { include: { item: true } },
      },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (booking.businessId !== business.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (booking.status !== 'active' && booking.status !== 'returned_pending_settlement') {
      return NextResponse.json({ error: 'Booking is not in a valid state for return' }, { status: 400 })
    }

    const body = await req.json()
    const { 
      conditionStatus, 
      notes, 
      photoUrls, 
      actualReturnDate, 
      deductionAmount, 
      deductionReasonCode, 
      deductionReasonText, 
      settlementMethod, 
      refundReference 
    } = body

    const validConditions = ['NO_NEW_DAMAGE', 'DAMAGED', 'MISSING_ITEMS', 'LATE_RETURN', 'NEEDS_REVIEW', 'OTHER']
    if (!validConditions.includes(conditionStatus)) {
      return NextResponse.json({ error: 'Invalid condition status' }, { status: 400 })
    }

    if (typeof deductionAmount !== 'number' || deductionAmount < 0 || deductionAmount > booking.depositAmount) {
      return NextResponse.json({ error: 'Invalid deduction amount' }, { status: 400 })
    }

    const refundAmount = booking.depositAmount - deductionAmount

    if (deductionAmount > 0) {
      if (!VALID_DEDUCTION_CODES.includes(deductionReasonCode)) {
        return NextResponse.json({ error: 'Invalid deduction reason code' }, { status: 400 })
      }
      if (!deductionReasonText) {
        return NextResponse.json({ error: 'Deduction reason text is required' }, { status: 400 })
      }
      if (deductionReasonCode === 'OTHER' && deductionReasonText.length < 10) {
        return NextResponse.json({ error: 'Detailed reason is required for OTHER' }, { status: 400 })
      }
    }

    const existingSettlement = await prisma.depositSettlement.findUnique({
      where: { bookingId: booking.id }
    })

    if (existingSettlement) {
      return NextResponse.json({ error: 'Deposit settlement already exists' }, { status: 400 })
    }

    let settlementStatus = 'PENDING_MANUAL'
    // If the method is automated or cash, we can finalize it. For now, following basic logic:
    if (settlementMethod !== 'MANUAL' && settlementMethod !== 'PENDING_MANUAL') {
      if (deductionAmount === 0) {
        settlementStatus = 'FULL_REFUND'
      } else if (deductionAmount === booking.depositAmount) {
        settlementStatus = 'WITHHELD'
      } else {
        settlementStatus = 'PARTIAL_REFUND'
      }
    }

    // Apply charges if needed based on code
    const isDamage = deductionReasonCode === 'ITEM_DAMAGE' || conditionStatus === 'DAMAGED'
    const isLate = deductionReasonCode === 'LATE_RETURN_FEE' || conditionStatus === 'LATE_RETURN'

    await prisma.$transaction(async (tx) => {
      // 1. Create Return Inspection
      await tx.rentalInspection.create({
        data: {
          bookingId: booking.id,
          type: 'RETURN',
          conditionStatus,
          notes,
          performedByUserId: user.id,
          media: photoUrls && photoUrls.length > 0 ? {
            create: photoUrls.map((url: string) => ({ url }))
          } : undefined
        }
      })

      // 2. Create Deposit Settlement
      await tx.depositSettlement.create({
        data: {
          bookingId: booking.id,
          originalDepositAmount: booking.depositAmount,
          deductionAmount,
          deductionReasonCode: deductionAmount > 0 ? deductionReasonCode : undefined,
          deductionReasonText: deductionAmount > 0 ? deductionReasonText : undefined,
          refundAmount,
          settlementStatus,
          settlementMethod,
          refundReference: refundReference || undefined,
          processedByUserId: user.id,
        }
      })

      // 3. Update Booking
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'completed',
          actualReturnDate: new Date(actualReturnDate || Date.now()),
          checkinNotes: notes,
          depositRefunded: refundAmount,
          damageCharge: isDamage ? deductionAmount : 0,
          lateFee: isLate ? deductionAmount : 0,
        }
      })
      
      // 4. Create In-App Notification
      await tx.notification.create({
        data: {
          userId: booking.customerId,
          type: 'deposit_settlement',
          channel: 'in_app',
          subject: deductionAmount === 0 ? 'Deposit Fully Refunded ✅' : 'Deposit Deduction Applied',
          body: deductionAmount === 0 
            ? `Your return was successful and your deposit of Rs. ${booking.depositAmount} has been refunded.`
            : `Your return inspection resulted in a deduction of Rs. ${deductionAmount} from your deposit. Reason: ${deductionReasonText}`,
          scheduledAt: new Date(),
          status: 'sent',
        }
      })
    })

    // Queue Event Notifications
    const itemName = booking.bookingItems[0]?.item?.name || 'Rental item'
    
    // 1. Notification for deposit
    queueEventNotifications({
      eventType: deductionAmount === 0 ? 'DEPOSIT_REFUNDED' : 'DEPOSIT_DEDUCTION_APPLIED',
      entityType: 'BOOKING',
      entityId: bookingId,
      recipients: [{
        userId: booking.customerId,
        type: 'CUSTOMER',
        phone: booking.customer.phone || null,
        email: booking.customer.user?.email || null,
        name: booking.customer.user?.name || 'Customer'
      }],
      metadata: {
        bookingId: booking.bookingNumber || booking.id,
        itemName,
        providerName: booking.business.name,
        depositAmount: String(booking.depositAmount),
        refundAmount: String(refundAmount),
        deductionAmount: String(deductionAmount),
        deductionReason: deductionReasonText || deductionReasonCode || '',
        settlementMethod: settlementMethod || '',
        settlementStatus: settlementStatus
      }
    }).catch(() => {})

    // 2. Notification for RETURN_COMPLETED (Customer)
    queueEventNotifications({
      eventType: 'RETURN_COMPLETED',
      entityType: 'BOOKING',
      entityId: bookingId,
      recipients: [{
        userId: booking.customerId,
        type: 'CUSTOMER',
        phone: booking.customer.phone || null,
        email: booking.customer.user?.email || null,
        name: booking.customer.user?.name || 'Customer'
      }],
      metadata: {
        bookingId: booking.bookingNumber || booking.id,
        itemName,
        providerName: booking.business.name
      }
    }).catch(() => {})

    // 3. Notification for RETURN_COMPLETED (Provider)
    queueEventNotifications({
      eventType: 'RETURN_COMPLETED',
      entityType: 'BOOKING',
      entityId: bookingId,
      recipients: [{
        userId: booking.business.userId,
        type: 'PROVIDER',
        phone: booking.business.phone || null,
        email: null,
        name: booking.business.name
      }],
      metadata: {
        bookingId: booking.bookingNumber || booking.id,
        itemName,
        customerName: booking.customer.user?.name || 'Customer'
      }
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
