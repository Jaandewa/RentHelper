import { requireVerifiedProviderAccess } from '@/lib/provider-guard'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sendHandoverThanksNotification, queueEventNotifications } from '@/lib/notifications/service'

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

    if (booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Booking is not confirmed' }, { status: 400 })
    }

    const body = await req.json()
    const { conditionStatus, notes, photoUrls } = body

    const validConditions = ['EXCELLENT', 'GOOD', 'FAIR', 'EXISTING_DAMAGE']
    if (!validConditions.includes(conditionStatus)) {
      return NextResponse.json({ error: 'Invalid condition status' }, { status: 400 })
    }

    const existingInspection = await prisma.rentalInspection.findFirst({
      where: {
        bookingId: booking.id,
        type: 'HANDOVER'
      }
    })

    if (existingInspection) {
      return NextResponse.json({ error: 'Handover inspection already exists' }, { status: 400 })
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      await tx.rentalInspection.create({
        data: {
          bookingId: booking.id,
          type: 'HANDOVER',
          conditionStatus,
          notes,
          performedByUserId: user.id,
          media: photoUrls && photoUrls.length > 0 ? {
            create: photoUrls.map((url: string) => ({ url }))
          } : undefined
        }
      })

      return await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'active',
          checkoutNotes: notes,
        },
        include: {
          business: true,
          customer: { include: { user: true } },
          bookingItems: { include: { item: true } },
        }
      })
    })

    // Notify customer
    sendHandoverThanksNotification(booking.customerId, booking.id).catch(e =>
      console.error('[Notification] Handover notification error:', e)
    )

    queueEventNotifications({
      eventType: 'ITEM_HANDED_OVER',
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
        customerName: booking.customer.user?.name || 'Customer',
        bookingId: booking.id,
        itemName: booking.bookingItems[0]?.item?.name || 'Rental item',
        providerName: booking.business.name,
        pickupDateTime: booking.pickupDate ? `${booking.pickupDate.toLocaleDateString()} ${booking.pickupTime || ''}`.trim() : '',
        returnDateTime: booking.returnDate ? `${booking.returnDate.toLocaleDateString()} ${booking.returnTime || ''}`.trim() : ''
      }
    }).catch(() => {})

    return NextResponse.json({ success: true, booking: updatedBooking })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
