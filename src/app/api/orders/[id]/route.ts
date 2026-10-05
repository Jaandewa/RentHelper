import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireVerifiedProviderAccess } from '@/lib/provider-guard'

export const runtime = 'nodejs'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, business } = await requireVerifiedProviderAccess()
    if (error) return error

    const { id } = await params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        business: true,
        customer: { include: { user: true } },
        bookingItems: { include: { item: true } },
        payments: true,
        refunds: true,
        customerRating: true,
        ad: true,
      }
    })

    if (!booking) return NextResponse.json({ message: 'Booking not found' }, { status: 404 })

    if (booking.businessId !== business.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
