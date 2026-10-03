import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPaymentConfirmationNotification, queueEventNotifications } from '@/lib/notifications/service'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // 1. Authenticate customer
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // 2. Get customer profile
  const customer = await prisma.customerProfile.findUnique({ where: { userId: session.user.id } })
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  // 3. Get booking with relations
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      business: true,
      customer: { include: { user: true } },
      bookingItems: { include: { item: true } },
    },
  })

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  // 4. Verify this booking belongs to the customer
  if (booking.customerId !== customer.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // 5. Verify status is 'awaiting_advance_payment'
  if (booking.status !== 'awaiting_advance_payment') {
    return NextResponse.json({ error: 'This booking is not awaiting advance payment' }, { status: 400 })
  }

  // 6. Check hold hasn't expired
  if (booking.holdExpiresAt && new Date() > booking.holdExpiresAt) {
    // Auto-expire the hold
    await prisma.booking.update({
      where: { id },
      data: { status: 'payment_expired', holdStatus: 'expired' },
    })
    return NextResponse.json({ error: 'Payment deadline has expired. Please submit a new booking request.' }, { status: 410 })
  }

  // 7. Parse body for payment method/reference
  const body = await req.json()
  const { method, reference, notes } = body

  // 8. Create Payment record
  const payment = await prisma.payment.create({
    data: {
      bookingId: id,
      amount: booking.advanceAmount,
      type: 'advance',
      method: method || 'bank_transfer',
      reference: reference || null,
      notes: notes || 'Advance payment',
    },
  })

  // 9. Update booking status
  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: 'confirmed',
      paymentStatus: 'partially_paid',
      holdStatus: 'converted',
      balanceDue: booking.totalAmount - booking.advanceAmount,
    },
  })

  // Unified notification: in-app + WhatsApp delivery log for both parties
  sendPaymentConfirmationNotification(booking.customerId, id, payment.id).catch(e =>
    console.error('[Notification] Payment confirmation notification error:', e)
  )

  // 10. Queue Event Notifications
  queueEventNotifications({
    eventType: 'PAYMENT_CONFIRMED',
    entityType: 'BOOKING',
    entityId: id,
    recipients: [{
      userId: booking.customerId,
      type: 'CUSTOMER',
      phone: booking.customer.phone || null,
      email: booking.customer.user?.email || null,
      name: booking.customer.user?.name || 'Customer'
    }],
    metadata: {
      bookingId: booking.id,
      itemName: booking.bookingItems[0]?.item?.name || 'Rental item',
      providerName: booking.business.name,
      amountPaid: String(booking.advanceAmount),
      advancePaid: String(booking.advanceAmount),
      remainingBalance: String(booking.totalAmount - booking.advanceAmount),
      paymentDate: new Date().toISOString()
    }
  }).catch(() => {})

  queueEventNotifications({
    eventType: 'BOOKING_CONFIRMED_PROVIDER',
    entityType: 'BOOKING',
    entityId: id,
    recipients: [{
      userId: booking.business.userId,
      type: 'PROVIDER',
      phone: booking.business.phone || null,
      email: null,
      name: booking.business.name
    }],
    metadata: {
      bookingId: booking.id,
      itemName: booking.bookingItems[0]?.item?.name || 'Rental item',
      customerName: booking.customer.user?.name || 'Customer',
      amountPaid: String(booking.advanceAmount),
      advancePaid: String(booking.advanceAmount),
      remainingBalance: String(booking.totalAmount - booking.advanceAmount),
      paymentDate: new Date().toISOString()
    }
  }).catch(() => {})

  return NextResponse.json({ success: true, booking: updated, payment })
}
