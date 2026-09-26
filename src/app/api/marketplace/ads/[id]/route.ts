import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sanitizeCategoryDataForPublic } from '@/lib/categoryConfig'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Increment viewsCount
    await prisma.rentalAd.updateMany({
      where: { id },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    })

    const ad = await prisma.rentalAd.findUnique({
      where: { id },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            conditionGrade: true,
            itemImages: true,
            category: true,
            status: true,
            description: true,
            brand: true,
            model: true,
            accessories: true,
            categoryData: true,
          }
        },
        business: {
          select: {
            id: true,
            name: true,
            city: true,
            logo: true,
            slug: true,
            address: true,
            phone: true,
          }
        },
      }
    })

    if (!ad || !ad.isPublished || !ad.isAvailable) {
      return NextResponse.json({ error: 'Ad not found or unavailable' }, { status: 404 })
    }

    // Sanitize categoryData for public visibility
    const rawCategoryData = ad.item?.categoryData as Record<string, any> | null
    const categorySlug = ad.item?.category?.slug || 'other'
    const publicCategoryData = sanitizeCategoryDataForPublic(categorySlug, rawCategoryData, (ad.item?.category?.fields as any) || [])

    const safeAd = {
      ...ad,
      item: {
        ...ad.item,
        categoryData: publicCategoryData,
      },
    }

    return NextResponse.json(safeAd)
  } catch (error) {
    console.error('Error fetching ad details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
