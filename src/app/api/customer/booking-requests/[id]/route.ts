import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!customerProfile) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id, customerId: customerProfile.id },
      include: {
        bookingItems: { include: { item: true } },
        business: true,
        ad: true,
        payments: true,
        providerRating: true,
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Fetch booking error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
