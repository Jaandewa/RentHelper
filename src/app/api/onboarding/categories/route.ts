import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { categories, otherCategoryName } = await req.json()
    
    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json({ message: 'Invalid categories' }, { status: 400 })
    }

    // Find or create a dummy business for now if they don't have one
    let business = await prisma.business.findUnique({
      where: { userId: session.user.id }
    })

    if (!business) {
      business = await prisma.business.create({
        data: {
          userId: session.user.id,
          name: 'My Business',
          slug: `biz-${session.user.id}`,
        }
      })
    }

    // Process custom category if "other" is selected
    let customSlug = null
    if (categories.includes('other') && otherCategoryName) {
      const baseSlug = otherCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      customSlug = `custom-${baseSlug}`
      
      // Upsert the custom category into the main categories table
      await prisma.category.upsert({
        where: { slug: customSlug },
        update: {},
        create: {
          name: otherCategoryName,
          slug: customSlug,
          icon: 'Package', // Generic icon
        }
      })
    }

    // Delete existing categories
    await prisma.businessCategory.deleteMany({
      where: { businessId: business.id }
    })

    // Create new ones
    if (categories.length > 0) {
      const categoriesToSave = categories
        .filter(c => c !== 'other' || !customSlug)
        .map(cat => ({
          businessId: business!.id,
          categorySlug: cat
        }))
        
      if (customSlug) {
        categoriesToSave.push({
          businessId: business!.id,
          categorySlug: customSlug
        })
      }

      await prisma.businessCategory.createMany({
        data: categoriesToSave
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
