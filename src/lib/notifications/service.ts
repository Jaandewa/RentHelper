/**
 * Unified Notification Service
 * 
 * Dispatches notifications through multiple channels:
 * - IN_APP: Always enabled (Notification model)
 * - WHATSAPP: Logs delivery attempt (NotificationDelivery model), calls whatsapp.ts
 * - EMAIL: Future channel (not implemented)
 * 
 * Each event-specific function:
 * 1. Creates an in-app Notification record
 * 2. Creates a NotificationDelivery log with eventType + metadata
 * 3. Calls the appropriate WhatsApp function (handles not_configured gracefully)
 * 4. Never throws — all errors are caught and logged
 */

import prisma from '@/lib/prisma'
import {
  sendKycApprovedWhatsApp,
  sendKycRejectedWhatsApp,
  sendBookingRequestWhatsApp,
  sendBookingAcceptedWhatsApp,
  sendBookingRejectedWhatsApp,
  sendBookingConfirmedWhatsApp,
  sendBookingConfirmedProviderWhatsApp,
  sendRegistrationOtpWhatsApp,
  sendItemHandedOverWhatsApp,
} from '@/lib/notifications/whatsapp'

// ── Event Types ──────────────────────────────────────────────────────────

export type NotificationEventType =
  | 'KYC_DECISION'
  | 'NEW_BOOKING_REQUEST'
  | 'PROVIDER_DECISION'
  | 'REGISTRATION_OTP'
  | 'PAYMENT_CONFIRMATION'
  | 'HANDOVER_THANKS'

// ── Core Dispatcher ──────────────────────────────────────────────────────

interface DispatchParams {
  userId: string
  eventType: NotificationEventType
  subject: string
  body: string
  recipientPhone?: string
  relatedEntityId?: string
  metadata?: Record<string, any>
}

/**
 * Core dispatcher — creates in-app notification.
 * WhatsApp delivery logs are created by sendWhatsAppText() with final status.
 * Never throws.
 */
async function dispatchNotification(params: DispatchParams): Promise<void> {
  const { userId, eventType, subject, body } = params

  // Create in-app notification (always)
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: eventType.toLowerCase(),
        channel: 'in_app',
        subject,
        body,
        scheduledAt: new Date(),
        status: 'sent',
      },
    })
  } catch (e) {
    console.error(`[Notification Service] Failed to create in-app notification for ${eventType}:`, e)
  }
}

// ── Event 1: KYC Decision ────────────────────────────────────────────────

export async function sendKycDecisionNotification(
  customerId: string,
  status: 'approved' | 'rejected',
  reason?: string
): Promise<void> {
  try {
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      include: { user: { select: { id: true, name: true } } },
    })
    if (!customer?.userId) return

    const customerName = customer.user?.name || 'Customer'
    const isApproved = status === 'approved'

    const subject = isApproved
      ? 'KYC Approved! 🎉'
      : 'KYC Verification Rejected'

    const body = isApproved
      ? 'Your account identity has been verified. You can now browse items and request rental bookings.'
      : `Your identity verification was rejected. Reason: ${reason || 'Documents not valid'}. Please resubmit corrected documents.`

    const metadata = {
      customerName,
      kycStatus: status.toUpperCase(),
      ...(reason ? { rejectionReason: reason } : {}),
    }

    await dispatchNotification({
      userId: customer.userId,
      eventType: 'KYC_DECISION',
      subject,
      body,
      recipientPhone: customer.phone || undefined,
      relatedEntityId: customerId,
      metadata,
    })

    // Send WhatsApp (non-blocking)
    if (customer.phone) {
      if (isApproved) {
        sendKycApprovedWhatsApp({ phoneNumber: customer.phone, customerName }).catch(e =>
          console.error('[Notification Service] KYC approved WhatsApp failed:', e)
        )
      } else {
        sendKycRejectedWhatsApp({ phoneNumber: customer.phone, customerName, reason: reason || 'Documents not valid' }).catch(e =>
          console.error('[Notification Service] KYC rejected WhatsApp failed:', e)
        )
      }
    }
  } catch (e) {
    console.error('[Notification Service] sendKycDecisionNotification error:', e)
  }
}

// ── Event 2: New Booking Request to Provider ─────────────────────────────

export async function sendNewBookingRequestNotification(
  businessId: string,
  bookingId: string
): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: { include: { user: true } },
        customer: { include: { user: true } },
        bookingItems: { include: { item: true } },
      },
    })
    if (!booking) return

    const providerUserId = booking.business.userId
    const customerName = booking.customer?.user?.name || 'Customer'
    const itemName = booking.bookingItems[0]?.item?.name || 'Rental item'
    const pickupDT = `${booking.pickupDate.toLocaleDateString()} ${booking.pickupTime || ''}`.trim()
    const returnDT = `${booking.returnDate.toLocaleDateString()} ${booking.returnTime || ''}`.trim()

    const metadata = {
      customerName,
      itemName,
      pickupDateTime: pickupDT,
      returnDateTime: returnDT,
      rentalTotal: booking.totalAmount,
    }

    await dispatchNotification({
      userId: providerUserId,
      eventType: 'NEW_BOOKING_REQUEST',
      subject: 'New Booking Request',
      body: `New rental request from ${customerName} for ${itemName}. Pickup: ${pickupDT}. Total: Rs. ${booking.totalAmount?.toLocaleString()}.`,
      recipientPhone: booking.business.phone || undefined,
      relatedEntityId: bookingId,
      metadata,
    })

    // WhatsApp already called from booking-requests/route.ts — no duplicate needed here
    // The existing sendBookingRequestWhatsApp call in the route handles this
  } catch (e) {
    console.error('[Notification Service] sendNewBookingRequestNotification error:', e)
  }
}

// ── Event 3: Provider Decision to Customer ───────────────────────────────

export async function sendProviderDecisionNotification(
  customerId: string,
  bookingId: string,
  decision: 'accepted' | 'rejected',
  rejectionReason?: string
): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: true,
        customer: { include: { user: true } },
        bookingItems: { include: { item: true } },
      },
    })
    if (!booking?.customer?.userId) return

    const itemName = booking.bookingItems[0]?.item?.name || 'Rental item'
    const providerName = booking.business.name
    const isAccepted = decision === 'accepted'
    const pickupDT = `${booking.pickupDate.toLocaleDateString()} ${booking.pickupTime || ''}`.trim()
    const returnDT = `${booking.returnDate.toLocaleDateString()} ${booking.returnTime || ''}`.trim()

    const subject = isAccepted
      ? 'Booking Request Accepted! ✅'
      : 'Booking Request Not Approved'

    const body = isAccepted
      ? `Your rental request for ${itemName} from ${providerName} has been accepted. Advance payment of Rs. ${booking.advanceAmount?.toLocaleString()} is required. Please log in to complete payment.`
      : `Your rental request for ${itemName} from ${providerName} was not approved. Reason: ${rejectionReason || 'Not specified'}. You can browse other items on the marketplace.`

    const metadata: Record<string, any> = {
      itemName,
      providerName,
      decision: decision.toUpperCase(),
    }
    if (isAccepted) {
      metadata.advanceAmount = booking.advanceAmount
      metadata.paymentDeadline = booking.holdExpiresAt?.toISOString()
    }
    if (rejectionReason) {
      metadata.rejectionReason = rejectionReason
    }

    await dispatchNotification({
      userId: booking.customer.userId,
      eventType: 'PROVIDER_DECISION',
      subject,
      body,
      recipientPhone: booking.customer.phone || undefined,
      relatedEntityId: bookingId,
      metadata,
    })

    // WhatsApp is already called from the accept/reject routes — no duplicate
  } catch (e) {
    console.error('[Notification Service] sendProviderDecisionNotification error:', e)
  }
}

// ── Event 4: Registration OTP (Stub) ─────────────────────────────────────

/**
 * Stub: Called when OTP system is implemented.
 * Currently no OTP model or generation exists in the codebase.
 * 
 * To enable: create OTP model, generate OTP in registration flow,
 * then call this function with the user ID, OTP code, and expiry.
 */
export async function sendRegistrationOtpNotification(
  userId: string,
  otpCode: string,
  expiryMinutes: number = 10
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })
    if (!user) return

    // Find customer profile for phone
    const customer = await prisma.customerProfile.findUnique({
      where: { userId },
      select: { phone: true },
    })

    const metadata = {
      otpCode, // Note: sensitive — will be redacted when WhatsApp templates are used
      expiryMinutes,
    }

    await dispatchNotification({
      userId,
      eventType: 'REGISTRATION_OTP',
      subject: 'Phone Verification Code',
      body: `Your verification code is ${otpCode}. It expires in ${expiryMinutes} minutes. Do not share this code with anyone.`,
      recipientPhone: customer?.phone || undefined,
      relatedEntityId: userId,
      metadata,
    })

    // WhatsApp OTP send via template renderer
    if (customer?.phone) {
      sendRegistrationOtpWhatsApp(customer.phone, {
        customerName: user?.name || 'Customer',
        otpCode,
        expiryMinutes,
      }).catch(e =>
        console.error('[Notification Service] OTP WhatsApp failed:', e)
      )
    }
  } catch (e) {
    console.error('[Notification Service] sendRegistrationOtpNotification error:', e)
  }
}

// ── Event 5: Payment Confirmation ────────────────────────────────────────

export async function sendPaymentConfirmationNotification(
  customerId: string,
  bookingId: string,
  paymentId: string
): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: true,
        customer: { include: { user: true } },
        bookingItems: { include: { item: true } },
        payments: { where: { id: paymentId } },
      },
    })
    if (!booking?.customer?.userId) return

    const payment = booking.payments[0]
    if (!payment) return

    const itemName = booking.bookingItems[0]?.item?.name || 'Rental item'
    const providerName = booking.business.name
    const balanceDue = booking.totalAmount - payment.amount

    const metadata = {
      bookingId: booking.bookingNumber,
      amountPaid: payment.amount,
      paymentDate: payment.paidAt.toISOString(),
      remainingBalance: balanceDue,
    }

    // Customer notification
    await dispatchNotification({
      userId: booking.customer.userId,
      eventType: 'PAYMENT_CONFIRMATION',
      subject: 'Payment Received ✅',
      body: `Your advance payment of Rs. ${payment.amount.toLocaleString()} for ${itemName} has been received. Booking confirmed! Remaining balance: Rs. ${balanceDue.toLocaleString()}.`,
      recipientPhone: booking.customer.phone || undefined,
      relatedEntityId: bookingId,
      metadata,
    })

    // Provider notification
    await dispatchNotification({
      userId: booking.business.userId,
      eventType: 'PAYMENT_CONFIRMATION',
      subject: 'Advance Payment Received',
      body: `Customer ${booking.customer.user?.name || 'Customer'} paid Rs. ${payment.amount.toLocaleString()} advance for ${itemName}. Booking is now confirmed.`,
      recipientPhone: booking.business.phone || undefined,
      relatedEntityId: bookingId,
      metadata: { ...metadata, customerName: booking.customer.user?.name },
    })

    // WhatsApp is already called from pay-advance/route.ts — no duplicate
  } catch (e) {
    console.error('[Notification Service] sendPaymentConfirmationNotification error:', e)
  }
}

// ── Event 6: Handover Thanks (Stub) ──────────────────────────────────────

/**
 * Stub: Called when handover API is implemented.
 * Currently no handover endpoint or handed_over status exists.
 * 
 * To enable: create a handover route (POST /api/provider/bookings/[id]/handover),
 * update booking status to 'active', then call this function.
 */
export async function sendHandoverThanksNotification(
  customerId: string,
  bookingId: string
): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: true,
        customer: { include: { user: true } },
        bookingItems: { include: { item: true } },
      },
    })
    if (!booking?.customer?.userId) return

    const itemName = booking.bookingItems[0]?.item?.name || 'Rental item'
    const pickupDT = `${booking.pickupDate.toLocaleDateString()} ${booking.pickupTime || ''}`.trim()
    const returnDT = `${booking.returnDate.toLocaleDateString()} ${booking.returnTime || ''}`.trim()
    const supportContact = booking.business.phone || booking.business.name || 'the provider'

    const metadata = {
      itemName,
      rentalPeriod: `${pickupDT} to ${returnDT}`,
      supportContact,
    }

    await dispatchNotification({
      userId: booking.customer.userId,
      eventType: 'HANDOVER_THANKS',
      subject: 'Item Picked Up! 🎉',
      body: `Thank you for renting ${itemName}! Your rental period is ${pickupDT} to ${returnDT}. For any assistance, contact ${supportContact}. Please return the item in good condition.`,
      recipientPhone: booking.customer.phone || undefined,
      relatedEntityId: bookingId,
      metadata,
    })

    // WhatsApp handover message via template renderer
    if (booking.customer.phone) {
      sendItemHandedOverWhatsApp(booking.customer.phone, {
        customerName: booking.customer.user?.name || 'Customer',
        itemName,
        providerName: booking.business.name,
        pickupDateTime: pickupDT,
        returnDateTime: returnDT,
        bookingId: booking.bookingNumber,
      }).catch(e =>
        console.error('[Notification Service] Handover WhatsApp failed:', e)
      )
    }
  } catch (e) {
    console.error('[Notification Service] sendHandoverThanksNotification error:', e)
  }
}

// ── Outbox Queue Functions ───────────────────────────────────────────────

export interface NotificationRecipient {
  userId?: string
  type: 'CUSTOMER' | 'PROVIDER' | 'ADMIN'
  phone?: string | null
  email?: string | null
  name?: string
}

export interface QueueNotificationParams {
  eventType: string
  channel: 'whatsapp' | 'email'
  recipientUserId?: string
  recipientType: 'CUSTOMER' | 'PROVIDER' | 'ADMIN'
  recipient: string
  entityType: string
  entityId: string
  templateKey?: string
  metadata?: Record<string, any>
}

export interface QueueEventParams {
  eventType: string
  entityType: string
  entityId: string
  recipients: NotificationRecipient[]
  metadata: Record<string, any>
  templateKey?: string
}

/**
 * Queue a single notification for async dispatch.
 * Uses idempotency key to prevent duplicates.
 */
export async function queueNotification(params: QueueNotificationParams): Promise<void> {
  const {
    eventType, channel, recipientUserId, recipientType,
    recipient, entityType, entityId, templateKey, metadata,
  } = params

  const idempotencyKey = `${eventType}:${entityId}:${recipientUserId || recipient}:${channel}`

  try {
    await prisma.notificationDelivery.upsert({
      where: { idempotencyKey },
      update: {},
      create: {
        type: channel === 'whatsapp' ? 'whatsapp_text' : 'email',
        eventType,
        channel,
        recipient,
        recipientUserId: recipientUserId || null,
        recipientType,
        entityType,
        relatedEntityId: entityId,
        templateKey: templateKey || eventType,
        metadata: metadata || undefined,
        idempotencyKey,
        status: 'pending',
        nextAttemptAt: new Date(),
        attemptCount: 0,
      },
    })
  } catch (error: any) {
    if (error?.code === 'P2002') return
    console.error(`[NotificationQueue] Failed to queue ${eventType}/${channel}:`, error?.message)
  }
}

/**
 * Queue notifications for all recipients across all channels.
 * Skips channels where the recipient has no contact info.
 */
export async function queueEventNotifications(params: QueueEventParams): Promise<void> {
  const { eventType, entityType, entityId, recipients, metadata, templateKey } = params

  const promises: Promise<void>[] = []

  for (const recipient of recipients) {
    if (recipient.phone) {
      promises.push(
        queueNotification({
          eventType, channel: 'whatsapp',
          recipientUserId: recipient.userId,
          recipientType: recipient.type,
          recipient: recipient.phone,
          entityType, entityId, templateKey,
          metadata: { ...metadata, recipientName: recipient.name || undefined },
        })
      )
    }
    if (recipient.email) {
      promises.push(
        queueNotification({
          eventType, channel: 'email',
          recipientUserId: recipient.userId,
          recipientType: recipient.type,
          recipient: recipient.email,
          entityType, entityId, templateKey,
          metadata: { ...metadata, recipientName: recipient.name || undefined },
        })
      )
    }
  }

  await Promise.allSettled(promises)
}

// ── Cancellation & Refund Notification Helpers ─────────────────────────────

export async function sendBookingCancelledNotificationToCustomer(
  bookingId: string,
  cancellationEventId: string,
  refundSummaryText: string
): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { include: { user: true } },
        business: true,
      },
    })
    if (!booking?.customer?.userId) return

    const idempotencyKey = `BOOKING_CANCELLED_CUSTOMER:${bookingId}:${cancellationEventId}`

    await dispatchNotification({
      userId: booking.customer.userId,
      eventType: 'PROVIDER_DECISION' as any,
      subject: `Booking ${booking.bookingNumber} Cancelled`,
      body: `Your booking #${booking.bookingNumber} has been cancelled. ${refundSummaryText}`,
      recipientPhone: booking.customer.phone || undefined,
      relatedEntityId: bookingId,
      metadata: { bookingNumber: booking.bookingNumber, cancellationEventId, refundSummaryText },
    })

    await queueNotification({
      eventType: 'BOOKING_CANCELLED' as any,
      channel: 'whatsapp',
      recipientUserId: booking.customer.userId,
      recipientType: 'CUSTOMER',
      recipient: booking.customer.phone || '',
      entityType: 'BOOKING',
      entityId: bookingId,
      metadata: { bookingNumber: booking.bookingNumber, cancellationEventId, refundSummaryText },
    })
  } catch (e) {
    console.error('[Notification Service] sendBookingCancelledNotificationToCustomer error:', e)
  }
}

export async function sendBookingCancelledNotificationToProvider(
  bookingId: string,
  cancellationEventId: string,
  cancelledByRole: 'CUSTOMER' | 'PROVIDER'
): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: true,
        customer: { include: { user: true } },
      },
    })
    if (!booking?.business?.userId) return

    const customerName = booking.customer?.user?.name || 'Customer'
    const byText = cancelledByRole === 'CUSTOMER' ? `by customer ${customerName}` : 'by your business'

    await dispatchNotification({
      userId: booking.business.userId,
      eventType: 'NEW_BOOKING_REQUEST' as any,
      subject: `Booking ${booking.bookingNumber} Cancelled`,
      body: `Booking #${booking.bookingNumber} was cancelled ${byText}.`,
      recipientPhone: booking.business.phone || undefined,
      relatedEntityId: bookingId,
      metadata: { bookingNumber: booking.bookingNumber, cancellationEventId, cancelledByRole },
    })

    if (booking.business.phone) {
      await queueNotification({
        eventType: 'BOOKING_CANCELLED' as any,
        channel: 'whatsapp',
        recipientUserId: booking.business.userId,
        recipientType: 'PROVIDER',
        recipient: booking.business.phone,
        entityType: 'BOOKING',
        entityId: bookingId,
        metadata: { bookingNumber: booking.bookingNumber, cancellationEventId, cancelledByRole },
      })
    }
  } catch (e) {
    console.error('[Notification Service] sendBookingCancelledNotificationToProvider error:', e)
  }
}

export async function sendRefundProcessedNotification(refundId: string): Promise<void> {
  try {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        booking: {
          include: {
            customer: { include: { user: true } },
            business: true,
          },
        },
      },
    })
    if (!refund?.booking?.customer?.userId) return

    const booking = refund.booking
    const customerUserId = booking.customer.userId

    await dispatchNotification({
      userId: customerUserId,
      eventType: 'PAYMENT_CONFIRMATION' as any,
      subject: `Refund Processed for Booking ${booking.bookingNumber}`,
      body: `Your refund of LKR ${refund.amount.toLocaleString()} for booking #${booking.bookingNumber} has been processed (${refund.referenceId ? `Ref: ${refund.referenceId}` : 'Recorded'}).`,
      recipientPhone: booking.customer.phone || undefined,
      relatedEntityId: refund.id,
      metadata: { bookingId: booking.id, amount: refund.amount, referenceId: refund.referenceId },
    })

    if (booking.customer.phone) {
      await queueNotification({
        eventType: 'REFUND_PROCESSED' as any,
        channel: 'whatsapp',
        recipientUserId: customerUserId,
        recipientType: 'CUSTOMER',
        recipient: booking.customer.phone,
        entityType: 'REFUND',
        entityId: refund.id,
        metadata: { bookingNumber: booking.bookingNumber, amount: refund.amount, referenceId: refund.referenceId },
      })
    }
  } catch (e) {
    console.error('[Notification Service] sendRefundProcessedNotification error:', e)
  }
}

export async function sendRefundFailedAlert(
  refundId: string,
  attemptNumber: number,
  reason: string
): Promise<void> {
  try {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        booking: {
          include: { business: true },
        },
      },
    })
    if (!refund?.booking?.business?.userId) return

    const providerUserId = refund.booking.business.userId

    // Queue internal alert for provider/admin only
    await dispatchNotification({
      userId: providerUserId,
      eventType: 'PAYMENT_CONFIRMATION' as any,
      subject: `Internal Alert: Refund Recording Failed`,
      body: `Refund processing failed for booking #${refund.booking.bookingNumber} (Attempt ${attemptNumber}). Reason: ${reason}`,
      relatedEntityId: refund.id,
      metadata: { refundId, attemptNumber, reason },
    })
  } catch (e) {
    console.error('[Notification Service] sendRefundFailedAlert error:', e)
  }
}
