import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sendProviderDecisionNotification, queueEventNotifications } from '@/lib/notifications/service'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const body = await req.json().catch(() => ({}))
    const { reason } = body

    if (!reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    // Get the booking with relations
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        business: true,
        customer: { include: { user: true } },
        bookingItems: { include: { item: true } },
      },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    // Verify provider owns this business
    if (booking.business.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Must be in pending_provider_approval status
    if (booking.status !== 'pending_provider_approval') {
      return NextResponse.json({ error: 'This request cannot be rejected in its current status' }, { status: 400 })
    }

    // Update booking status atomically
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'rejected_by_provider',
        providerDecisionAt: new Date(),
        providerDecisionBy: session.user.id,
        providerRejectReason: reason,
        // Release any hold if one existed
        holdStatus: booking.holdStatus ? 'released' : null,
      },
      include: {
        business: true,
        customer: { include: { user: true } },
        bookingItems: { include: { item: true } },
      },
    })

    // Unified notification: in-app + WhatsApp delivery log
    sendProviderDecisionNotification(booking.customerId, id, 'rejected', reason).catch(e =>
      console.error('[Notification] Provider reject notification error:', e)
    )

    // Queue event notification
    queueEventNotifications({
      eventType: 'BOOKING_REJECTED',
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
        customerName: booking.customer.user?.name || 'Customer',
        bookingId: id,
        itemName: booking.bookingItems[0]?.item?.name || 'Rental item',
        providerName: booking.business.name,
        rejectionReason: reason
      }
    }).catch(() => {})

    return NextResponse.json({ success: true, booking: updated })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
