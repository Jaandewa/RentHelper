import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// GET /api/admin/users — list all users
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const status = searchParams.get('status')
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (role) where.role = role
  if (status) where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true, status: true,
        createdAt: true, suspendReason: true, suspendedUntil: true,
        businessProfile: { select: { id: true, name: true, approvalStatus: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({ users, total, page, limit })
}

// PATCH /api/admin/users/[id] — edit user
export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { id, name, email, role, status, suspendReason, suspendedUntil } = body

  const user = await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      role,
      status,
      suspendReason: suspendReason || null,
      suspendedUntil: suspendedUntil ? new Date(suspendedUntil) : null,
    },
    select: { id: true, name: true, email: true, role: true, status: true },
  })

  return NextResponse.json({ user, message: 'User updated successfully' })
}
