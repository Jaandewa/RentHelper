import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await req.json()
    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const customSlug = `custom-${business.id.slice(0,5)}-${baseSlug}`

    // Upsert the custom category
    await prisma.category.upsert({
      where: { slug: customSlug },
      update: {},
      create: {
        name: name,
        slug: customSlug,
        icon: 'Package',
      }
    })

    // Link it to the business
    await prisma.businessCategory.upsert({
      where: { 
        businessId_categorySlug: {
          businessId: business.id,
          categorySlug: customSlug
        }
      },
      update: {},
      create: {
        businessId: business.id,
        categorySlug: customSlug
      }
    })

    return NextResponse.json({ success: true, slug: customSlug })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
