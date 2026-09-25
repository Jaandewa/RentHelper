import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/marketplace/providers/[providerId] — Get store profile & published rental ads
export async function GET(_req: NextRequest, { params }: { params: Promise<{ providerId: string }> }) {
  try {
    const { providerId } = await params

    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { id: providerId },
          { slug: providerId },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        city: true,
        address: true,
        phone: true,
        currency: true,
        approvalStatus: true,
        createdAt: true,
        rentalAds: {
          where: {
            isPublished: true,
            isAvailable: true,
          },
          orderBy: { createdAt: 'desc' },
          include: {
            item: {
              select: {
                name: true,
                conditionGrade: true,
                itemImages: true,
                category: { select: { name: true, slug: true } },
              },
            },
          },
        },
        providerRatings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    if (!business) {
      return NextResponse.json({ message: 'Provider store not found' }, { status: 404 })
    }

    return NextResponse.json({ provider: business })
  } catch (error) {
    console.error('Error fetching provider detail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
