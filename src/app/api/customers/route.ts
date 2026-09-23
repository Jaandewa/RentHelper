import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
    const q = searchParams.get('q')
    const kycStatus = searchParams.get('kycStatus')

    const where: any = {}
    if (q) {
      where.OR = [
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ]
    }
    if (kycStatus) where.kycStatus = kycStatus

    // Get customers who have booked with this business
    const bookingCustomerIds = await prisma.booking.findMany({
      where: { businessId: business.id },
      select: { customerId: true },
      distinct: ['customerId'],
    })
    const customerIds = bookingCustomerIds.map(b => b.customerId)

    const customers = await prisma.customerProfile.findMany({
      where: {
        ...where,
        id: { in: customerIds },
      },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(customers)
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

    const body = await req.json()
    const { name, email, phone, address, city, nicNumber, dateOfBirth, emergencyContact, emergencyPhone } = body

    if (!name || !email || !phone) {
      return NextResponse.json({ message: 'Name, email and phone are required' }, { status: 400 })
    }

    // Check if user with this email exists
    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      // Create a new user account for the customer
      user = await prisma.user.create({
        data: {
          name,
          email,
          role: 'customer',
        }
      })
    }

    // Check if customer profile exists
    let customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: user.id }
    })

    if (!customerProfile) {
      customerProfile = await prisma.customerProfile.create({
        data: {
          userId: user.id,
          nicNumber,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          emergencyContact,
          emergencyPhone,
          address,
          city,
          kycStatus: nicNumber ? 'pending' : 'pending',
        }
      })
    } else {
      customerProfile = await prisma.customerProfile.update({
        where: { id: customerProfile.id },
        data: {
          nicNumber: nicNumber || customerProfile.nicNumber,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : customerProfile.dateOfBirth,
          emergencyContact: emergencyContact || customerProfile.emergencyContact,
          emergencyPhone: emergencyPhone || customerProfile.emergencyPhone,
          address: address || customerProfile.address,
          city: city || customerProfile.city,
        }
      })
    }

    return NextResponse.json({ success: true, customerId: customerProfile.id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
