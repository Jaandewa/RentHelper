import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookingId } = await params

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: true,
      },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (booking.business.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const inspections = await prisma.rentalInspection.findMany({
      where: { bookingId },
      include: {
        media: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const depositSettlement = await prisma.depositSettlement.findUnique({
      where: { bookingId },
    })

    return NextResponse.json({ success: true, inspections, depositSettlement })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
