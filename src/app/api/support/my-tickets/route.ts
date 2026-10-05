import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/support/my-tickets — Fetch tickets for the authenticated customer or provider
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      messages: {
        where: { isInternal: false }, // Internal admin notes are strictly excluded from user view
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          senderType: true,
          message: true,
          createdAt: true,
        },
      },
    },
  })

  return NextResponse.json({ tickets })
}
