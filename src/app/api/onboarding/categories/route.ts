import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { categories } = await req.json()
    
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

    // Delete existing categories
    await prisma.businessCategory.deleteMany({
      where: { businessId: business.id }
    })

    // Create new ones
    if (categories.length > 0) {
      await prisma.businessCategory.createMany({
        data: categories.map(cat => ({
          businessId: business!.id,
          categorySlug: cat
        }))
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
