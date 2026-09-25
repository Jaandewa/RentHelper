import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export function getCustomerDisplayId(id: string): string {
  const clean = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const suffix = clean.slice(-6).padStart(6, '0')
  return `CUS-${suffix}`
}

// GET /api/provider/customers — List registered customers discoverable by provider
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role?.toLowerCase()
    if (role !== 'provider' && role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden — Providers only' }, { status: 403 })
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    })

    const { searchParams } = new URL(req.url)
    const search = (searchParams.get('q') || searchParams.get('search') || '').trim()
    const kycStatus = searchParams.get('kycStatus')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit

    // Base query: registered customer role users only
    const where: any = {
      user: {
        role: 'customer',
      },
    }

    // Privacy filter: allow cross-provider share OR customer has booked with this provider
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

    // Search filter
    if (search) {
      const normalizedSearch = search.toLowerCase()
      // Strip CUS- if search is a display ID
      const cleanSearch = normalizedSearch.replace(/^cus-/, '')

      where.AND = [
        {
          OR: [
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { phone: { contains: search, mode: 'insensitive' } },
            { phone2: { contains: search, mode: 'insensitive' } },
            { emergencyPhone: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { id: { contains: cleanSearch, mode: 'insensitive' } },
          ],
        },
      ]
    }

    if (kycStatus && kycStatus !== 'all') {
      where.kycStatus = kycStatus
    }

    const [customers, total] = await Promise.all([
      prisma.customerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          phone: true,
          phone2: true,
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
            },
          },
          blacklistEntries: {
            where: { isActive: true },
            select: { id: true, severity: true, reason: true },
          },
          _count: {
            select: { bookings: true },
          },
        },
      }),
      prisma.customerProfile.count({ where }),
    ])

    // Format provider-safe customer records
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
        primaryContactNumber: c.phone || 'N/A',
        secondaryContactNumber: c.phone2 || null,
        city: c.city || 'N/A',
        kycStatus: c.kycStatus || 'not_submitted',
        accountStatus: c.accountStatus || 'incomplete',
        trustScore: c.trustScore || 0,
        totalBookings: c.totalBookings || c._count.bookings || 0,
        blacklistStatus,
        blacklistReason: activeBlacklist?.reason || null,
        createdAt: c.createdAt,
      }
    })

    return NextResponse.json({
      customers: safeCustomers,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error('Error fetching provider customers:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
