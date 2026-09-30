import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkItemAvailability } from '@/lib/booking/availability'
import { calculateBookingPricing, validateBookingDates, combineDateAndTime } from '@/lib/booking/pricing'
import { generateBookingNumber } from '@/lib/utils'
import { sendBookingRequestWhatsApp } from '@/lib/notifications/whatsapp'
import { sendNewBookingRequestNotification } from '@/lib/notifications/service'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    })

    if (!customerProfile || customerProfile.kycStatus !== 'verified') {
      return NextResponse.json({ error: 'Customer not verified' }, { status: 403 })
    }

    const body = await req.json()
    const {
      adId, pickupDate, returnDate, pickupTime, returnTime,
      purpose, purposeDetails, customerNotes, deliveryRequired,
      deliveryAddress, categorySpecificData, agreementAccepted
    } = body

    if (!agreementAccepted) {
      return NextResponse.json({ error: 'You must accept the agreement' }, { status: 400 })
    }

    const dateValidation = validateBookingDates(pickupDate, returnDate, pickupTime, returnTime)
    if (!dateValidation.valid) {
      return NextResponse.json({ error: dateValidation.error }, { status: 400 })
    }

    const ad = await prisma.rentalAd.findUnique({
      where: { id: adId },
      include: { item: true, business: true }
    })

    if (!ad || !ad.isPublished || !ad.isAvailable) {
      return NextResponse.json({ error: 'Ad is not available' }, { status: 404 })
    }

    const pDate = new Date(pickupDate)
    const rDate = new Date(returnDate)

    const availability = await checkItemAvailability(ad.item.id, pDate, rDate)
    if (!availability.available) {
      return NextResponse.json({ error: 'Item is not available for these dates' }, { status: 409 })
    }

    // Server-side price recalculation — never trust client values
    const pricing = calculateBookingPricing({
      pickupDate,
      returnDate,
      pickupTime,
      returnTime,
      dailyRate: ad.dailyPrice || ad.item.dailyRate,
      weeklyRate: ad.weeklyPrice || ad.item.weeklyRate,
      monthlyRate: ad.monthlyPrice || ad.item.monthlyRate,
      hourlyRate: ad.hourlyPrice || ad.item.hourlyRate,
      securityDeposit: ad.securityDeposit,
      deliveryCharge: deliveryRequired ? 0 : 0, // Provider will confirm delivery charge
      setupCharge: 0,
      discount: 0,
      advancePercent: ad.business.advancePaymentPercent || 30
    })

    const bookingNumber = generateBookingNumber()

    const booking = await prisma.booking.create({
      data: {
        businessId: ad.businessId,
        customerId: customerProfile.id,
        bookingNumber,
        status: 'pending_provider_approval',
        paymentStatus: 'unpaid',
        pickupDate: pDate,
        returnDate: rDate,
        pickupTime,
        returnTime,
        subtotal: pricing.rentalCharge,
        deliveryCharge: pricing.deliveryCharge,
        setupCharge: pricing.setupCharge,
        discountAmount: 0,
        advanceAmount: pricing.advanceRequired,
        depositAmount: pricing.securityDeposit,
        totalAmount: pricing.totalPayable,
        balanceDue: pricing.balanceDue,
        // Customer-initiated fields
        adId,
        purpose,
        purposeDetails,
        customerNotes,
        deliveryRequired: deliveryRequired || false,
        deliveryAddress: deliveryRequired ? deliveryAddress : null,
        categorySpecificData: categorySpecificData || null,
        agreementAccepted: true,
        agreementAcceptedAt: new Date(),
        agreementVersion: '1.0',
        // Price snapshots
        dailyRateSnapshot: ad.dailyPrice || ad.item.dailyRate,
        weeklyRateSnapshot: ad.weeklyPrice || ad.item.weeklyRate,
        monthlyRateSnapshot: ad.monthlyPrice || ad.item.monthlyRate,
        hourlyRateSnapshot: ad.hourlyPrice || ad.item.hourlyRate,
        source: 'customer_marketplace',
        notes: customerNotes,
        // Booking items
        bookingItems: {
          create: [{
            itemId: ad.item.id,
            quantity: 1,
            dailyRate: ad.dailyPrice || ad.item.dailyRate,
            days: pricing.rentalDays,
            itemTotal: pricing.rentalCharge,
          }],
        },
      },
      include: {
        bookingItems: { include: { item: true } },
        customer: { include: { user: true } },
      },
    })

    // Unified notification: in-app + WhatsApp delivery log for provider
    sendNewBookingRequestNotification(ad.businessId, booking.id).catch(e =>
      console.error('[Notification] New booking request notification error:', e)
    )

    // Direct WhatsApp to provider (existing behavior preserved)
    try {
      if (ad.business.phone) {
        await sendBookingRequestWhatsApp(ad.business.phone, {
          requestNumber: bookingNumber,
          customerName: booking.customer.user.name || 'Customer',
          itemName: ad.item.name,
          pickupDateTime: `${pickupDate} ${pickupTime || ''}`.trim(),
          returnDateTime: `${returnDate} ${returnTime || ''}`.trim(),
          purpose: purpose || 'General rental',
          rentalTotal: pricing.totalPayable,
          deposit: pricing.securityDeposit,
          advanceRequired: pricing.advanceRequired,
        })
      }
    } catch (e) {
      console.error('WhatsApp notification failed:', e)
    }

    return NextResponse.json({ success: true, booking }, { status: 201 })
  } catch (error) {
    console.error('Booking request error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!customerProfile) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = { customerId: customerProfile.id }
    if (status && status !== 'all') {
      where.status = status
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        bookingItems: { include: { item: true } },
        business: true,
        ad: true,
        payments: true,
        providerRating: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Fetch bookings error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
