import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        business: true,
        customer: { include: { user: true } },
        bookingItems: { include: { item: true } },
        payments: true,
        customerRating: true,
        ad: true,
      }
    })

    if (!booking) return NextResponse.json({ message: 'Booking not found' }, { status: 404 })

    if (booking.business.userId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
