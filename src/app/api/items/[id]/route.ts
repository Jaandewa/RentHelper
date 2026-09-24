import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { id: string } }) {
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

    const item = await prisma.item.findUnique({
      where: { id: params.id, businessId: business.id },
      include: {
        itemImages: { orderBy: { sortOrder: 'asc' } },
        category: true
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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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

    const existingItem = await prisma.item.findUnique({
      where: { id: params.id }
    })

    if (!existingItem || existingItem.businessId !== business.id) {
      return NextResponse.json({ message: 'Item not found or forbidden' }, { status: 404 })
    }

    const body = await req.json()
    const {
      name, categorySlug, sku, brand, model, serialNumber,
      description, conditionGrade, dailyRate, weeklyRate,
      monthlyRate, depositAmount, bufferHours, purchasePrice,
      replacementCost, notes, accessories
    } = body

    if (!name || !dailyRate) {
      return NextResponse.json({ message: 'Name and daily rate are required' }, { status: 400 })
    }

    let category = await prisma.category.findUnique({ where: { slug: categorySlug || 'other' } })
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categorySlug?.replace(/-/g, ' ') || 'Other',
          slug: categorySlug || 'other',
        }
      })
    }

    const item = await prisma.item.update({
      where: { id: params.id },
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
      }
    })

    if (body.images) {
      await prisma.itemImage.deleteMany({ where: { itemId: params.id } })
      if (body.images.length > 0) {
        await prisma.itemImage.createMany({
          data: body.images.map((img: { url: string, caption?: string }, index: number) => ({
            itemId: params.id,
            url: img.url,
            caption: img.caption || null,
            fileName: img.url.split('/').pop() || 'image.jpg',
            sortOrder: index
          }))
        })
      }
    }

    return NextResponse.json(item)
  } catch (error: any) {
    console.error('Error updating item:', error)
    return NextResponse.json({ message: `Server error: ${error?.message || 'Unknown'}` }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

    // Verify item belongs to this business
    const item = await prisma.item.findUnique({
      where: { id: params.id }
    })

    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 })
    }

    if (item.businessId !== business.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await prisma.item.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
