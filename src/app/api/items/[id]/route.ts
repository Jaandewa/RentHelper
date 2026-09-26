import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { validateCategoryData, DEFAULT_CATEGORY_CONFIGS } from '@/lib/categoryConfig'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    const item = await prisma.item.findUnique({
      where: { id: id, businessId: business.id },
      include: {
        itemImages: { orderBy: { sortOrder: 'asc' } },
        category: true,
        rentalAd: { select: { id: true, isPublished: true } },
      }
    })

    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching item:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    const existingItem = await prisma.item.findUnique({
      where: { id: id }
    })

    if (!existingItem || existingItem.businessId !== business.id) {
      return NextResponse.json({ message: 'Item not found or forbidden' }, { status: 404 })
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
        message: 'Name and daily rate are required',
        errors: {
          ...(!name ? { name: 'Name is required' } : {}),
          ...(!dailyRate ? { dailyRate: 'Daily rate is required' } : {}),
        }
      }, { status: 400 })
    }

    let slugToUse = categorySlug

    // Handle Custom Category
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

    const item = await prisma.item.update({
      where: { id: id },
      data: {
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
      },
      include: {
        category: true,
        itemImages: true,
      }
    })

    if (body.images) {
      await prisma.$transaction(async (tx) => {
        await tx.itemImage.deleteMany({ where: { itemId: id } })
        for (let i = 0; i < body.images.length; i++) {
          const img = body.images[i]
          await tx.itemImage.create({
            data: {
              itemId: id,
              url: img.url,
              caption: img.caption || null,
              fileName: img.url.split('/').pop() || 'image.jpg',
              sortOrder: i,
            }
          })
        }
      })
    }

    return NextResponse.json(item)
  } catch (error: any) {
    console.error('Error updating item:', error)
    return NextResponse.json({ message: `Server error: ${error?.message || 'Unknown'}` }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    const item = await prisma.item.findUnique({
      where: { id: id }
    })

    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 })
    }

    if (item.businessId !== business.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await prisma.item.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
