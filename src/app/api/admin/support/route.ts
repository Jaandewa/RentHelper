import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// GET /api/admin/support — fetch support tickets for Admin Inbox
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const searchParams = req.nextUrl.searchParams
  const status = searchParams.get('status')
  const category = searchParams.get('category')

  const whereClause: any = {}
  if (status && status !== 'ALL') whereClause.status = status
  if (category && category !== 'ALL') whereClause.category = category

  const tickets = await prisma.supportTicket.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      _count: { select: { messages: true } },
    },
  })

  return NextResponse.json({ tickets })
}
