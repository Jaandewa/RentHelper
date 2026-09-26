import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { name, fields } = await req.json()
    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    })

    if (!business) {
      return NextResponse.json({ message: 'Business profile not found' }, { status: 404 })
    }

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const customSlug = `custom-${business.id.slice(0, 5)}-${baseSlug}`

    const category = await prisma.category.upsert({
      where: { slug: customSlug },
      update: {
        name,
        fields: fields || [],
        isCustom: true,
        businessId: business.id,
      },
      create: {
        name,
        slug: customSlug,
        icon: '🏷️',
        description: `Custom category created by ${business.name}`,
        fields: fields || [],
        isCustom: true,
        businessId: business.id,
        sortOrder: 99,
      },
    })

    await prisma.businessCategory.upsert({
      where: {
        businessId_categorySlug: {
          businessId: business.id,
          categorySlug: customSlug,
        },
      },
      update: {},
      create: {
        businessId: business.id,
        categorySlug: customSlug,
      },
    })

    return NextResponse.json({ success: true, category, slug: customSlug })
  } catch (error) {
    console.error('Error creating custom category:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
