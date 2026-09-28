import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sendBookingRejectedWhatsApp } from '@/lib/notifications/whatsapp'

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

    // Send WhatsApp notification to customer (failure does not block rejection)
    try {
      const customerPhone = booking.customer.phone
      if (customerPhone) {
        const itemName = booking.bookingItems[0]?.item?.name || 'Rental item'

        await sendBookingRejectedWhatsApp(customerPhone, {
          itemName,
          providerName: booking.business.name,
          reason,
        })
      }
    } catch (e) {
      console.error('WhatsApp notification failed:', e)
    }

    return NextResponse.json({ success: true, booking: updated })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
