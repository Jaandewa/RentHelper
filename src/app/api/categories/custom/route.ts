import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireVerifiedProviderAccess } from '@/lib/provider-guard'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { error, business } = await requireVerifiedProviderAccess()
    if (error) return error

    const { name, fields } = await req.json()
    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 })
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
