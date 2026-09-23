import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// GET /api/admin/subscriptions — list all subscriptions
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        business: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    }),
    prisma.subscription.count({ where }),
  ])

  // MRR from active subscriptions
  const activeData = await prisma.subscription.findMany({
    where: { status: 'active' },
    select: { pricePerMonth: true },
  })
  const mrr = activeData.reduce((sum, s) => sum + s.pricePerMonth, 0)

  return NextResponse.json({ subscriptions, total, page, limit, mrr })
}

// POST /api/admin/subscriptions — update a subscription
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { businessId, status, planName, pricePerMonth, maxItems, trialEndsAt, currentPeriodEnd, notes } = body

  const subscription = await prisma.subscription.upsert({
    where: { businessId },
    create: {
      businessId,
      status: status || 'trial',
      planName: planName || 'Standard Plan',
      pricePerMonth: pricePerMonth || 0,
      maxItems: maxItems || 50,
      trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
      notes,
    },
    update: {
      status,
      planName,
      pricePerMonth,
      maxItems,
      trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : undefined,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : undefined,
      notes,
    },
  })

  return NextResponse.json({ subscription, message: 'Subscription updated' })
}
