import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// GET /api/admin/categories — list all categories
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { items: true } } },
  })

  return NextResponse.json({ categories })
}

// POST /api/admin/categories — create a new category
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { name, slug, icon, description, sortOrder } = body

  if (!name || !slug) {
    return NextResponse.json({ message: 'Name and slug are required' }, { status: 400 })
  }

  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ message: 'Slug already exists' }, { status: 409 })
  }

  const category = await prisma.category.create({
    data: { name, slug, icon: icon || null, description: description || null, sortOrder: sortOrder || 0 },
  })

  return NextResponse.json({ category }, { status: 201 })
}
