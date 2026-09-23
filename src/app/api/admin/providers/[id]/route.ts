import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// GET /api/admin/providers/[id] — full provider detail
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, status: true, createdAt: true, role: true } },
      subscription: true,
      categories: true,
      _count: { select: { items: true, bookings: true } },
    },
  })

  if (!business) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  return NextResponse.json({ business })
}

// PATCH /api/admin/providers/[id] — approve/reject/suspend + subscription changes
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const { approvalStatus, approvalNote, subscription } = body

  const updates: Record<string, unknown> = {}
  if (approvalStatus) {
    updates.approvalStatus = approvalStatus
    updates.approvalNote = approvalNote || null
    updates.approvedBy = session!.user.id
    updates.approvedAt = new Date()
  }

  const business = await prisma.business.update({
    where: { id },
    data: updates,
  })

  // Update subscription if provided
  if (subscription) {
    const { status, planName, pricePerMonth, maxItems, trialEndsAt, currentPeriodEnd, notes } = subscription
    await prisma.subscription.upsert({
      where: { businessId: id },
      create: {
        businessId: id,
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
  }

  return NextResponse.json({ business, message: 'Updated successfully' })
}
