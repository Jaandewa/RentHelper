import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPaymentConfirmationNotification } from '@/lib/notifications/service'

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

  // 10. Send WhatsApp to both parties (existing behavior preserved)
  try {
    const customerPhone = booking.customer.phone
    if (customerPhone) {
      const { sendBookingConfirmedWhatsApp } = await import('@/lib/notifications/whatsapp')
      await sendBookingConfirmedWhatsApp(customerPhone, {
        itemName: booking.bookingItems[0]?.item?.name || 'Rental item',
        providerName: booking.business.name,
        pickupDateTime: `${booking.pickupDate.toLocaleDateString()} ${booking.pickupTime || ''}`.trim(),
        returnDateTime: `${booking.returnDate.toLocaleDateString()} ${booking.returnTime || ''}`.trim(),
        advancePaid: booking.advanceAmount,
        balanceDue: booking.totalAmount - booking.advanceAmount,
        deposit: booking.depositAmount,
      })
    }
  } catch (e) { console.error('WhatsApp notification failed:', e) }

  try {
    if (booking.business.phone) {
      const { sendBookingConfirmedProviderWhatsApp } = await import('@/lib/notifications/whatsapp')
      await sendBookingConfirmedProviderWhatsApp(booking.business.phone, {
        customerName: booking.customer.user.name || 'Customer',
        itemName: booking.bookingItems[0]?.item?.name || 'Rental item',
        pickupDateTime: `${booking.pickupDate.toLocaleDateString()} ${booking.pickupTime || ''}`.trim(),
        returnDateTime: `${booking.returnDate.toLocaleDateString()} ${booking.returnTime || ''}`.trim(),
        advancePaid: booking.advanceAmount,
      })
    }
  } catch (e) { console.error('WhatsApp notification failed:', e) }

  return NextResponse.json({ success: true, booking: updated, payment })
}
