import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/marketplace/providers — List provider stores with search & city filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || searchParams.get('providerName') || ''
    const city = searchParams.get('city') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)
    const skip = (page - 1) * limit

    const where: any = {
      isActive: true,
      approvalStatus: 'approved',
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          city: true,
          address: true,
          phone: true,
          _count: {
            select: {
              items: { where: { isActive: true } },
              rentalAds: { where: { isPublished: true } },
            },
          },
        },
      }),
      prisma.business.count({ where }),
    ])

    return NextResponse.json({
      providers: businesses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching marketplace providers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
