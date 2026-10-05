import { requireVerifiedProviderAccess } from '@/lib/provider-guard'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { error, business } = await requireVerifiedProviderAccess()
    if (error) return error

    const { bookingId } = await params

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (booking.businessId !== business.id) {
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
