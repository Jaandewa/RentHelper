import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookingId } = await params

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: true,
        customer: { include: { user: true } },
      },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (booking.customer.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (booking.status !== 'active') {
      return NextResponse.json({ error: 'Booking is not currently active' }, { status: 400 })
    }

    const body = await req.json()
    const { notes, photoUrls } = body

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updateData = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'returned_pending_settlement',
        },
      })

      if (notes || (photoUrls && photoUrls.length > 0)) {
        await tx.rentalInspection.create({
          data: {
            bookingId: booking.id,
            type: 'RETURN',
            conditionStatus: 'NEEDS_REVIEW', // Customer mark return usually triggers review
            notes,
            performedByUserId: session.user.id,
            media: photoUrls && photoUrls.length > 0 ? {
              create: photoUrls.map((url: string) => ({ url }))
            } : undefined
          }
        })
      }

      await tx.notification.create({
        data: {
          userId: booking.business.userId,
          type: 'return_marked',
          channel: 'in_app',
          subject: 'Item Returned by Customer',
          body: `Customer ${booking.customer.user?.name || 'Customer'} has marked the item as returned for booking ${booking.bookingNumber}. Please complete the return inspection.`,
          scheduledAt: new Date(),
          status: 'sent',
        }
      })

      return updateData
    })

    return NextResponse.json({ success: true, booking: updatedBooking })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
