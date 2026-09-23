import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// GET /api/admin/customers — list all customer profiles
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const kycStatus = searchParams.get('kycStatus')
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (kycStatus) where.kycStatus = kycStatus
  if (search) {
    where.OR = [
      { user: { name: { contains: search } } },
      { user: { email: { contains: search } } },
      { nicNumber: { contains: search } },
    ]
  }

  const [customers, total] = await Promise.all([
    prisma.customerProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, status: true, createdAt: true } },
        customerDocuments: true,
        _count: { select: { bookings: true } },
      },
    }),
    prisma.customerProfile.count({ where }),
  ])

  return NextResponse.json({ customers, total, page, limit })
}
