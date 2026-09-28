import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkItemAvailability } from '@/lib/booking/availability'
import { sendBookingAcceptedWhatsApp } from '@/lib/notifications/whatsapp'

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

    // Re-check availability for each booking item
    for (const bi of booking.bookingItems) {
      const availability = await checkItemAvailability(
        bi.itemId,
        booking.pickupDate,
        booking.returnDate,
        booking.id // exclude current booking from conflict check
      )

      if (!availability.available) {
        return NextResponse.json({
          error: `Item "${bi.item.name}" is no longer available for these dates`,
          conflicts: availability.conflicts,
        }, { status: 409 })
      }
    }

    // Set hold expiry — use business config or default 24 hours
    const holdHours = 24
    const holdExpiresAt = new Date(Date.now() + holdHours * 60 * 60 * 1000)

    // Update booking status atomically
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'awaiting_advance_payment',
        providerDecisionAt: new Date(),
        providerDecisionBy: session.user.id,
        holdExpiresAt,
        holdStatus: 'active',
      },
      include: {
        business: true,
        customer: { include: { user: true } },
        bookingItems: { include: { item: true } },
        ad: true,
      },
    })

    // Send WhatsApp notification to customer (failure does not roll back acceptance)
    try {
      const customerPhone = booking.customer.phone
      if (customerPhone) {
        const itemName = booking.bookingItems[0]?.item?.name || 'Rental item'
        const pickupDT = `${booking.pickupDate.toLocaleDateString()} ${booking.pickupTime || ''}`.trim()
        const returnDT = `${booking.returnDate.toLocaleDateString()} ${booking.returnTime || ''}`.trim()

        await sendBookingAcceptedWhatsApp(customerPhone, {
          itemName,
          providerName: booking.business.name,
          pickupDateTime: pickupDT,
          returnDateTime: returnDT,
          advanceRequired: booking.advanceAmount,
        })
      }
    } catch (e) {
      console.error('WhatsApp notification failed:', e)
    }

    return NextResponse.json({
      success: true,
      booking: updated,
      holdExpiresAt: holdExpiresAt.toISOString(),
      paymentDeadline: holdExpiresAt.toISOString(),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
