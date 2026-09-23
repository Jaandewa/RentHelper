import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// GET /api/admin/providers — list all businesses with user, subscription info
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const approvalStatus = searchParams.get('approvalStatus') // pending | approved | rejected | suspended
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (approvalStatus) where.approvalStatus = approvalStatus
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { user: { email: { contains: search } } },
      { user: { name: { contains: search } } },
    ]
  }

  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, status: true, createdAt: true } },
        subscription: true,
        _count: { select: { items: true, bookings: true } },
      },
    }),
    prisma.business.count({ where }),
  ])

  return NextResponse.json({ businesses, total, page, limit })
}
