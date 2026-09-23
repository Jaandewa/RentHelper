import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const [
    totalProviders,
    pendingProviders,
    totalCustomers,
    activeSubscriptions,
    trialSubscriptions,
    totalBookings,
    recentProviders,
    recentCustomers,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { approvalStatus: 'pending' } }),
    prisma.customerProfile.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.subscription.count({ where: { status: 'trial' } }),
    prisma.booking.count(),
    prisma.business.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } }, subscription: true },
    }),
    prisma.user.findMany({
      take: 5,
      where: { role: 'customer' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, createdAt: true, status: true },
    }),
  ])

  // MRR calculation
  const activeSubData = await prisma.subscription.findMany({
    where: { status: 'active' },
    select: { pricePerMonth: true },
  })
  const mrr = activeSubData.reduce((sum, s) => sum + s.pricePerMonth, 0)

  // Monthly signup stats (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const monthlySignups = await prisma.user.groupBy({
    by: ['createdAt'],
    where: { createdAt: { gte: sixMonthsAgo }, role: 'provider' },
    _count: true,
  })

  return NextResponse.json({
    stats: {
      totalProviders,
      pendingProviders,
      totalCustomers,
      activeSubscriptions,
      trialSubscriptions,
      totalBookings,
      mrr,
    },
    recentProviders,
    recentCustomers,
  })
}
