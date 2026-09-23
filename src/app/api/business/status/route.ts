import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/business/status — returns current provider's approval status + subscription
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    include: { subscription: true },
  })

  if (!business) {
    return NextResponse.json({ approvalStatus: null, subscription: null })
  }

  return NextResponse.json({
    approvalStatus: business.approvalStatus,
    subscription: business.subscription,
  })
}
