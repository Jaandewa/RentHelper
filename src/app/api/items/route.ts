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
      replacementCost, notes, accessories
    } = body

    if (!name || !dailyRate) {
      return NextResponse.json({ message: 'Name and daily rate are required' }, { status: 400 })
    }

    // Find or create the category
    let category = await prisma.category.findUnique({ where: { slug: categorySlug || 'other' } })
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categorySlug?.replace(/-/g, ' ') || 'Other',
          slug: categorySlug || 'other',
        }
      })
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
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
