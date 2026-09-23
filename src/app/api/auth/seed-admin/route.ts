import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const DEFAULT_CATEGORIES = [
  { name: 'Camera & Video',      slug: 'camera-video',    icon: '📸', description: 'Cameras, lenses, lighting, tripods, and video gear', sortOrder: 1 },
  { name: 'Vehicles',            slug: 'vehicles',        icon: '🚗', description: 'Cars, vans, bikes, and other vehicles', sortOrder: 2 },
  { name: 'Party & Events',      slug: 'party-events',    icon: '🎉', description: 'Tables, chairs, tents, decorations, and sound systems', sortOrder: 3 },
  { name: 'Tools & Equipment',   slug: 'tools-equipment', icon: '🔧', description: 'Power tools, hand tools, ladders, and machinery', sortOrder: 4 },
  { name: 'Clothing & Bridal',   slug: 'clothing-bridal', icon: '👗', description: 'Dresses, suits, costumes, and accessories', sortOrder: 5 },
  { name: 'IT Equipment',        slug: 'it-equipment',    icon: '💻', description: 'Laptops, projectors, printers, and AV equipment', sortOrder: 6 },
  { name: 'Sports & Outdoors',   slug: 'sports-outdoors', icon: '⚽', description: 'Sports gear, camping equipment, and outdoor items', sortOrder: 7 },
  { name: 'Medical Equipment',   slug: 'medical',         icon: '🏥', description: 'Wheelchairs, crutches, medical devices for home use', sortOrder: 8 },
  { name: 'Musical Instruments', slug: 'musical',         icon: '🎸', description: 'Guitars, keyboards, drums, PA systems', sortOrder: 9 },
  { name: 'Other',               slug: 'other',           icon: '📦', description: 'Miscellaneous rental items', sortOrder: 10 },
]

// POST /api/auth/seed-admin
// Creates the admin user + default categories if not already present.
// Remove or protect this endpoint before going to production.
export async function POST() {
  try {
    const results: string[] = []

    // 1. Seed admin user
    const email = 'admin@renthelper.lk'
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      // Force-reset password and ensure status is active
      const password = await bcrypt.hash('Admin@1234', 12)
      await prisma.user.update({ where: { email }, data: { status: 'active', role: 'admin', password } })
      results.push('Admin already exists — password and status refreshed')
    } else {
      const password = await bcrypt.hash('Admin@1234', 12)
      await prisma.user.create({
        data: { name: 'RentHelper Admin', email, password, role: 'admin', status: 'active' }
      })
      results.push('Admin user created: admin@renthelper.lk / Admin@1234')
    }

    // 2. Seed default site settings
    await prisma.siteSettings.upsert({
      where: { id: '1' },
      update: {},
      create: { id: '1' },
    })
    results.push('Site settings seeded')

    // 3. Seed default categories
    let seeded = 0
    for (const cat of DEFAULT_CATEGORIES) {
      const exists = await prisma.category.findUnique({ where: { slug: cat.slug } })
      if (!exists) {
        await prisma.category.create({ data: cat })
        seeded++
      }
    }
    results.push(`Categories: ${seeded} new seeded (${DEFAULT_CATEGORIES.length - seeded} already existed)`)

    return NextResponse.json({
      message: 'Seed completed',
      results,
      loginEmail: email,
      loginPassword: 'Admin@1234',
    }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error', error: String(error) }, { status: 500 })
  }
}
