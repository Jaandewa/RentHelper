import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Default categories auto-seeded on first access
const DEFAULT_CATEGORIES = [
  { name: 'Camera & Video',    slug: 'camera-video',    icon: '📸', description: 'Cameras, lenses, lighting, tripods, and video gear', sortOrder: 1 },
  { name: 'Vehicles',          slug: 'vehicles',        icon: '🚗', description: 'Cars, vans, bikes, and other vehicles', sortOrder: 2 },
  { name: 'Party & Events',    slug: 'party-events',    icon: '🎉', description: 'Tables, chairs, tents, decorations, and sound systems', sortOrder: 3 },
  { name: 'Tools & Equipment', slug: 'tools-equipment', icon: '🔧', description: 'Power tools, hand tools, ladders, and machinery', sortOrder: 4 },
  { name: 'Clothing & Bridal', slug: 'clothing-bridal', icon: '👗', description: 'Dresses, suits, costumes, and accessories', sortOrder: 5 },
  { name: 'IT Equipment',      slug: 'it-equipment',    icon: '💻', description: 'Laptops, projectors, printers, and AV equipment', sortOrder: 6 },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', icon: '⚽', description: 'Sports gear, camping equipment, and outdoor adventure items', sortOrder: 7 },
  { name: 'Medical Equipment', slug: 'medical',         icon: '🏥', description: 'Wheelchairs, crutches, medical devices for home use', sortOrder: 8 },
  { name: 'Musical Instruments', slug: 'musical',       icon: '🎸', description: 'Guitars, keyboards, drums, PA systems', sortOrder: 9 },
  { name: 'Other',             slug: 'other',           icon: '📦', description: 'Miscellaneous rental items', sortOrder: 10 },
]

export async function GET() {
  try {
    const session = await auth()

    // Seed defaults if no categories exist yet
    const count = await prisma.category.count()
    if (count === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: {},
          create: cat,
        })
      }
    }

    // For providers: include count of their own items per category
    // For admin: include total item count across all providers
    let businessId: string | null = null
    if (session?.user?.id && session.user.role !== 'admin') {
      const business = await prisma.business.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      businessId = business?.id ?? null
    }

    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            items: businessId
              ? { where: { businessId } }
              : true,
          },
        },
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json({ categories: DEFAULT_CATEGORIES.map(c => ({ ...c, _count: { items: 0 } })) })
  }
}
