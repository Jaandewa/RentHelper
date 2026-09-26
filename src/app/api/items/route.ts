import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { validateCategoryData, DEFAULT_CATEGORY_CONFIGS } from '@/lib/categoryConfig'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const q = searchParams.get('q')

    const where: any = { businessId: business.id, isActive: true }
    if (status) where.status = status
    if (categoryId) where.categoryId = categoryId
    if (q) where.name = { contains: q, mode: 'insensitive' }

    const items = await prisma.item.findMany({
      where,
      include: {
        category: true,
        itemImages: { orderBy: { sortOrder: 'asc' }, take: 1 },
        rentalAd: { select: { id: true, isPublished: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(items)
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

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const body = await req.json()
    const {
      name, categorySlug, sku, brand, model, serialNumber,
      description, conditionGrade, dailyRate, weeklyRate,
      monthlyRate, depositAmount, bufferHours, purchasePrice,
      replacementCost, notes, accessories, categoryData,
      customCategoryName, customFields
    } = body

    if (!categorySlug) {
      return NextResponse.json({
        success: false,
        message: 'Category selection is required',
        errors: { categorySlug: 'Category is required' }
      }, { status: 400 })
    }

    if (!name || !dailyRate) {
      return NextResponse.json({
        success: false,
        message: 'Item name and daily rate are required',
        errors: {
          ...(!name ? { name: 'Item name is required' } : {}),
          ...(!dailyRate ? { dailyRate: 'Daily rate is required' } : {}),
        }
      }, { status: 400 })
    }

    let slugToUse = categorySlug

    // Handle Custom Category ("Other")
    if (categorySlug === 'other' && customCategoryName && customCategoryName.trim()) {
      const baseSlug = customCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      slugToUse = `custom-${business.id.slice(0, 5)}-${baseSlug}`

      await prisma.category.upsert({
        where: { slug: slugToUse },
        update: {
          name: customCategoryName,
          fields: customFields || [],
          isCustom: true,
          businessId: business.id,
        },
        create: {
          name: customCategoryName,
          slug: slugToUse,
          icon: '🏷️',
          description: `Custom category created by ${business.name}`,
          fields: customFields || [],
          isCustom: true,
          businessId: business.id,
          sortOrder: 99,
        }
      })
    }

    // Find target category
    let category = await prisma.category.findUnique({ where: { slug: slugToUse } })
    if (!category) {
      const defaultConfig = DEFAULT_CATEGORY_CONFIGS[slugToUse]
      category = await prisma.category.create({
        data: {
          name: defaultConfig?.name || slugToUse.replace(/-/g, ' '),
          slug: slugToUse,
          icon: defaultConfig?.icon || '📦',
          fields: defaultConfig?.fields ? (defaultConfig.fields as any) : [],
        }
      })
    }

    // Server-side Category Data Validation
    const categoryFieldsConfig = (category.fields as any[]) || customFields || []
    const validation = validateCategoryData(slugToUse, categoryData || {}, categoryFieldsConfig)
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed for category-specific attributes',
        errors: validation.errors
      }, { status: 400 })
    }

    const item = await prisma.item.create({
      data: {
        businessId: business.id,
        categoryId: category.id,
        name,
        sku,
        brand,
        model,
        serialNumber,
        description,
        conditionGrade: conditionGrade || 'good',
        dailyRate: parseFloat(dailyRate),
        weeklyRate: weeklyRate ? parseFloat(weeklyRate) : null,
        monthlyRate: monthlyRate ? parseFloat(monthlyRate) : null,
        depositAmount: depositAmount ? parseFloat(depositAmount) : 0,
        bufferHours: bufferHours ? parseInt(bufferHours) : 2,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        replacementCost: replacementCost ? parseFloat(replacementCost) : null,
        notes,
        accessories: accessories ? JSON.stringify(accessories) : null,
        categoryData: categoryData || null,
        itemImages: body.images && body.images.length > 0 ? {
          create: body.images.map((img: { url: string, caption?: string }, index: number) => ({
            url: img.url,
            caption: img.caption || null,
            fileName: img.url.split('/').pop() || 'image.jpg',
            sortOrder: index
          }))
        } : undefined,
      },
      include: {
        category: true,
        itemImages: true,
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    console.error('Item save error:', error)
    return NextResponse.json({ message: `Server error: ${error?.message || 'Unknown'}` }, { status: 500 })
  }
}
