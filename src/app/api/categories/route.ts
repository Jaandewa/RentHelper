import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { DEFAULT_CATEGORY_CONFIGS } from '@/lib/categoryConfig'

// Default categories list
const INITIAL_CATEGORIES = [
  { name: 'Camera & Video', slug: 'camera-video', icon: '📸', description: 'Cameras, lenses, video gear, cinema rigs, and accessories', sortOrder: 1 },
  { name: 'Mobile Phones & Tablets', slug: 'mobile-tablets', icon: '📱', description: 'Smartphones, tablets, iPads, and mobile devices', sortOrder: 2 },
  { name: 'Laptops & IT Equipment', slug: 'it-equipment', icon: '💻', description: 'Laptops, MacBooks, desktops, monitors, and IT hardware', sortOrder: 3 },
  { name: 'Vehicles', slug: 'vehicles', icon: '🚗', description: 'Cars, vans, SUVs, bikes, three-wheelers, and transport', sortOrder: 4 },
  { name: 'Clothing & Bridal', slug: 'clothing-bridal', icon: '👗', description: 'Bridal wear, suits, sarees, tuxedos, and costumes', sortOrder: 5 },
  { name: 'Party & Events', slug: 'party-events', icon: '🎉', description: 'Tents, chairs, tables, lighting, and event supplies', sortOrder: 6 },
  { name: 'Tools & Equipment', slug: 'tools-equipment', icon: '🔧', description: 'Power tools, construction machinery, and ladders', sortOrder: 7 },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', icon: '⚽', description: 'Camping tents, kayaks, bicycles, and adventure gear', sortOrder: 8 },
  { name: 'Sound & Stage', slug: 'sound-stage', icon: '🔊', description: 'PA speakers, mixers, microphones, and DJ equipment', sortOrder: 9 },
  { name: 'Furniture & Appliances', slug: 'furniture-appliances', icon: '🛏️', description: 'Sofa sets, beds, refrigerators, and appliances', sortOrder: 10 },
  { name: 'Medical Equipment', slug: 'medical', icon: '🏥', description: 'Wheelchairs, hospital beds, and home medical devices', sortOrder: 11 },
  { name: 'Rooms, Halls & Studios', slug: 'rooms-halls-studios', icon: '🏠', description: 'Event halls, photo/video studios, and meeting rooms', sortOrder: 12 },
  { name: 'Other', slug: 'other', icon: '📦', description: 'Miscellaneous rental items and custom categories', sortOrder: 13 },
]

export async function GET() {
  try {
    const session = await auth()

    // Seed defaults if no categories exist yet
    const count = await prisma.category.count()
    if (count === 0) {
      for (const cat of INITIAL_CATEGORIES) {
        const config = DEFAULT_CATEGORY_CONFIGS[cat.slug]
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: {
            fields: config ? (config.fields as any) : [],
          },
          create: {
            ...cat,
            fields: config ? (config.fields as any) : [],
          },
        })
      }
    }

    let businessId: string | null = null
    if (session?.user?.id && session.user.role !== 'admin') {
      const business = await prisma.business.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      businessId = business?.id ?? null
    }

    // Return active global categories OR categories belonging to this provider
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        OR: [
          { businessId: null },
          ...(businessId ? [{ businessId }] : []),
        ],
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            items: businessId ? { where: { businessId } } : true,
          },
        },
      },
    })

    // Attach default fields if stored fields is empty
    const enrichedCategories = categories.map(cat => {
      const storedFields = cat.fields as any[]
      const defaultConfig = DEFAULT_CATEGORY_CONFIGS[cat.slug]
      const fields = storedFields && storedFields.length > 0
        ? storedFields
        : defaultConfig ? defaultConfig.fields : []

      return {
        ...cat,
        fields,
      }
    })

    return NextResponse.json({ categories: enrichedCategories })
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json({
      categories: INITIAL_CATEGORIES.map(c => ({
        ...c,
        fields: DEFAULT_CATEGORY_CONFIGS[c.slug]?.fields || [],
        _count: { items: 0 },
      })),
    })
  }
}
