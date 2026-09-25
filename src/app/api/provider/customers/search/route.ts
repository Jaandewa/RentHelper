import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getCustomerDisplayId } from '@/app/api/provider/customers/route'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role?.toLowerCase()
    if (role !== 'provider' && role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || searchParams.get('search') || '').trim()

    if (!q) {
      return NextResponse.json({ customers: [] })
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    })

    const cleanSearch = q.toLowerCase().replace(/^cus-/, '')
    // Phone normalization variant
    const digitsOnly = q.replace(/[^0-9]/g, '')
    const phoneVariant = digitsOnly.length >= 9 ? digitsOnly.slice(-9) : digitsOnly

    const where: any = {
      user: {
        role: 'customer',
      },
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

    const ORConditions: any[] = [
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
      { phone: { contains: q, mode: 'insensitive' } },
      { phone2: { contains: q, mode: 'insensitive' } },
      { emergencyPhone: { contains: q, mode: 'insensitive' } },
      { id: { contains: cleanSearch, mode: 'insensitive' } },
    ]

    if (phoneVariant && phoneVariant.length >= 7) {
      ORConditions.push({ phone: { contains: phoneVariant } })
      ORConditions.push({ phone2: { contains: phoneVariant } })
      ORConditions.push({ emergencyPhone: { contains: phoneVariant } })
    }

    where.AND = [{ OR: ORConditions }]

    const customers = await prisma.customerProfile.findMany({
      where,
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        phone: true,
        phone2: true,
        emergencyPhone: true,
        city: true,
        kycStatus: true,
        trustScore: true,
        totalBookings: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        blacklistEntries: {
          where: { isActive: true },
          select: { id: true, severity: true },
        },
        _count: {
          select: { bookings: true },
        },
      },
    })

    const suggestions = customers.map(c => {
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
        city: c.city || 'N/A',
        kycStatus: c.kycStatus || 'not_submitted',
        trustScore: c.trustScore || 0,
        totalBookings: c.totalBookings || c._count.bookings || 0,
        blacklistStatus,
      }
    })

    return NextResponse.json({ customers: suggestions })
  } catch (error) {
    console.error('Error in provider customer search:', error)
    return NextResponse.json({ customers: [] }, { status: 500 })
  }
}
