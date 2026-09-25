import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getCustomerDisplayId } from '@/app/api/provider/customers/route'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id }
    })

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || searchParams.get('search') || '').trim()
    const kycStatus = searchParams.get('kycStatus')

    const where: any = {
      user: {
        role: 'customer',
      }
    }

    if (business) {
      const existingBookings = await prisma.booking.findMany({
        where: { businessId: business.id },
        select: { customerId: true },
        distinct: ['customerId'],
      })
      const existingCustomerIds = existingBookings.map(b => b.customerId)

      where.OR = [
        { allowCrossProviderShare: true },
        { allowCrossProviderShare: null },
        { id: { in: existingCustomerIds } },
      ]
    }

    if (q) {
      const cleanSearch = q.toLowerCase().replace(/^cus-/, '')
      where.AND = [
        {
          OR: [
            { user: { name: { contains: q, mode: 'insensitive' } } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
            { phone: { contains: q, mode: 'insensitive' } },
            { phone2: { contains: q, mode: 'insensitive' } },
            { emergencyPhone: { contains: q, mode: 'insensitive' } },
            { city: { contains: q, mode: 'insensitive' } },
            { id: { contains: cleanSearch, mode: 'insensitive' } },
          ]
        }
      ]
    }

    if (kycStatus && kycStatus !== 'all') {
      where.kycStatus = kycStatus
    }

    const customers = await prisma.customerProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        phone: true,
        phone2: true,
        emergencyPhone: true,
        city: true,
        kycStatus: true,
        accountStatus: true,
        trustScore: true,
        totalBookings: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        blacklistEntries: {
          where: { isActive: true },
          select: { id: true, severity: true, reason: true },
        },
        _count: {
          select: { bookings: true }
        }
      }
    })

    const safeCustomers = customers.map(c => {
      const activeBlacklist = c.blacklistEntries?.[0]
      const blacklistStatus = activeBlacklist
        ? activeBlacklist.severity.toUpperCase()
        : 'NONE'

      return {
        id: c.id,
        userId: c.userId,
        displayId: getCustomerDisplayId(c.id),
        fullName: c.user?.name || 'Customer',
        email: c.user?.email || '',
        primaryContactNumber: c.phone || c.emergencyPhone || 'N/A',
        secondaryContactNumber: c.phone2 || null,
        city: c.city || 'N/A',
        kycStatus: c.kycStatus || 'not_submitted',
        accountStatus: c.accountStatus || 'incomplete',
        trustScore: c.trustScore || 0,
        totalBookings: c.totalBookings || c._count.bookings || 0,
        blacklistStatus,
        blacklistReason: activeBlacklist?.reason || null,
        createdAt: c.createdAt,
        user: c.user,
        phone: c.phone || c.emergencyPhone,
        emergencyPhone: c.emergencyPhone,
      }
    })

    return NextResponse.json(safeCustomers)
  } catch (error) {
    console.error('Error fetching customers:', error)
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

    if (!name || !email || (!phone && !emergencyPhone)) {
      return NextResponse.json({ message: 'Name, email and phone number are required' }, { status: 400 })
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
          phone: phone || emergencyPhone || null,
          nicNumber: nicNumber || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          emergencyContact,
          emergencyPhone,
          address,
          city,
          kycStatus: 'not_submitted',
          accountStatus: 'incomplete',
        }
      })
    } else {
      customerProfile = await prisma.customerProfile.update({
        where: { id: customerProfile.id },
        data: {
          phone: phone || customerProfile.phone,
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
