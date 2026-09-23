import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

function generateBookingNumber() {
  const now = new Date()
  const year = now.getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `BK-${year}-${rand}`
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id }
    })
    if (!business) return NextResponse.json({ message: 'Business not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const q = searchParams.get('q')

    const where: any = { businessId: business.id }
    if (status && status !== 'all') where.status = status
    if (q) where.bookingNumber = { contains: q }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: { include: { user: { select: { name: true, email: true } } } },
        bookingItems: { include: { item: { select: { name: true } } } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id }
    })
    if (!business) return NextResponse.json({ message: 'Business not found' }, { status: 404 })

    const body = await req.json()
    const {
      customerId, items, pickupDate, returnDate,
      subtotal, totalAmount, totalDeposit, advanceAmount,
      deliveryCharge, discountAmount, notes
    } = body

    if (!customerId || !items?.length || !pickupDate || !returnDate) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const pickup = new Date(pickupDate)
    const returnD = new Date(returnDate)

    // Conflict detection: check if any item is already booked in this date range
    for (const bookingItem of items) {
      const conflicts = await prisma.bookingItem.findMany({
        where: {
          itemId: bookingItem.id,
          booking: {
            businessId: business.id,
            status: { notIn: ['cancelled', 'completed'] },
            AND: [
              { pickupDate: { lt: returnD } },
              { returnDate: { gt: pickup } },
            ],
          },
        },
      })
      if (conflicts.length > 0) {
        const item = await prisma.item.findUnique({ where: { id: bookingItem.id }, select: { name: true } })
        return NextResponse.json(
          { message: `Booking conflict: "${item?.name}" is already booked for this date range` },
          { status: 409 }
        )
      }
    }

    // Get customer
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      include: { user: true }
    })
    if (!customer) return NextResponse.json({ message: 'Customer not found' }, { status: 404 })

    // Determine initial booking status based on KYC
    const bookingStatus = customer.kycStatus === 'verified' ? 'confirmed' : 'pending_confirmation'

    const days = Math.max(1, Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)))

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        businessId: business.id,
        customerId,
        bookingNumber: generateBookingNumber(),
        status: bookingStatus,
        paymentStatus: 'unpaid',
        pickupDate: pickup,
        returnDate: returnD,
        subtotal: parseFloat(subtotal) || 0,
        deliveryCharge: parseFloat(deliveryCharge) || 0,
        discountAmount: parseFloat(discountAmount) || 0,
        advanceAmount: parseFloat(advanceAmount) || 0,
        depositAmount: parseFloat(totalDeposit) || 0,
        totalAmount: parseFloat(totalAmount) || 0,
        balanceDue: parseFloat(totalAmount) - parseFloat(advanceAmount || 0),
        notes,
        bookingItems: {
          create: items.map((item: any) => ({
            itemId: item.id,
            quantity: item.quantity || 1,
            dailyRate: parseFloat(item.dailyRate),
            days,
            itemTotal: parseFloat(item.dailyRate) * (item.quantity || 1) * days,
          })),
        },
      },
      include: { bookingItems: true },
    })

    // Update item statuses to 'booked'
    await prisma.item.updateMany({
      where: { id: { in: items.map((i: any) => i.id) } },
      data: { status: 'booked' },
    })

    // Try Google Calendar sync if integration exists
    try {
      const calIntegration = await prisma.calendarIntegration.findUnique({
        where: { businessId: business.id }
      })

      if (calIntegration?.syncEnabled) {
        const { google } = await import('googleapis')
        const oauth2Client = new google.auth.OAuth2()
        oauth2Client.setCredentials({
          access_token: calIntegration.accessToken,
          refresh_token: calIntegration.refreshToken,
        })

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
        const event = await calendar.events.insert({
          calendarId: calIntegration.calendarId || 'primary',
          requestBody: {
            summary: `📦 ${booking.bookingNumber} — ${customer.user?.name || 'Customer'}`,
            description: `Rental booking\nItems: ${items.map((i: any) => i.name).join(', ')}\nTotal: Rs. ${totalAmount}`,
            start: { dateTime: pickup.toISOString() },
            end: { dateTime: returnD.toISOString() },
            colorId: '2',
          },
        })

        // Save calendar event ID
        await prisma.booking.update({
          where: { id: booking.id },
          data: { calendarEventId: event.data.id }
        })
      }
    } catch (calError) {
      // Non-fatal: log but don't fail the booking creation
      console.warn('Calendar sync failed:', calError)
    }

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
