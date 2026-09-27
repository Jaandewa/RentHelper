import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
// import { checkItemAvailability } from '@/lib/booking/availability'
// import { sendBookingAcceptedWhatsApp } from '@/lib/notifications/whatsapp'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Get the booking with relations
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        business: true,
        customer: { include: { user: true } },
        bookingItems: { include: { item: true } },
        ad: true,
      },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    // Verify provider owns this business
    if (booking.business.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Must be in pending_provider_approval status
    if (booking.status !== 'pending_provider_approval') {
      return NextResponse.json({ error: 'This request cannot be accepted in its current status' }, { status: 400 })
    }

    // Re-check availability (stubbed out for now, can implement later if needed, but normally we'd check here)
    for (const bi of booking.bookingItems) {
      const conflicts = await prisma.bookingItem.findMany({
        where: {
          itemId: bi.itemId,
          booking: {
            status: { notIn: ['cancelled', 'completed', 'rejected_by_provider', 'payment_expired'] },
            id: { not: booking.id },
            AND: [
              { pickupDate: { lt: booking.returnDate } },
              { returnDate: { gt: booking.pickupDate } }
            ]
          }
        }
      })
      
      if (conflicts.length > 0) {
        return NextResponse.json({
          error: `Item "${bi.item.name}" is no longer available for these dates`,
          conflicts,
        }, { status: 409 })
      }
    }

    // Set hold expiry to 24 hours from now
    const holdExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Update booking status
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'awaiting_advance_payment',
        providerDecisionAt: new Date(),
        providerDecisionBy: session.user.id,
        holdExpiresAt,
        holdStatus: 'active',
      },
    })

    // Send WhatsApp notification to customer (stubbed out)
    try {
      const customerPhone = booking.customer.phone
      if (customerPhone) {
        // await sendBookingAcceptedWhatsApp(...)
      }
    } catch (e) { console.error('WhatsApp notification failed:', e) }

    return NextResponse.json({ success: true, booking: updated })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
