import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// PATCH /api/admin/providers/[id]/edit — Admin edit provider business details with audit log
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const { name, address, city, description, advancePaymentPercent, timezone, auditReason } = body

  if (!auditReason || typeof auditReason !== 'string' || !auditReason.trim()) {
    return NextResponse.json({ message: 'Mandatory audit reason is required for administrative business profile changes.' }, { status: 400 })
  }

  const existing = await prisma.business.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  if (!existing) {
    return NextResponse.json({ message: 'Business not found' }, { status: 404 })
  }

  const beforeState = {
    name: existing.name,
    address: existing.address,
    city: existing.city,
    description: existing.description,
    advancePaymentPercent: existing.advancePaymentPercent,
    timezone: existing.timezone,
  }

  const updatedBusiness = await prisma.business.update({
    where: { id },
    data: {
      name: name !== undefined ? name.trim() : existing.name,
      address: address !== undefined ? address : existing.address,
      city: city !== undefined ? city : existing.city,
      description: description !== undefined ? description : existing.description,
      advancePaymentPercent: advancePaymentPercent !== undefined ? Number(advancePaymentPercent) : existing.advancePaymentPercent,
      timezone: timezone !== undefined ? timezone : existing.timezone,
    },
  })

  const afterState = {
    name: updatedBusiness.name,
    address: updatedBusiness.address,
    city: updatedBusiness.city,
    description: updatedBusiness.description,
    advancePaymentPercent: updatedBusiness.advancePaymentPercent,
    timezone: updatedBusiness.timezone,
  }

  // Record audit log entry
  await prisma.activityLog.create({
    data: {
      userId: session!.user.id,
      action: 'ADMIN_EDIT_PROVIDER_BUSINESS',
      entityType: 'BUSINESS',
      entityId: id,
      details: JSON.stringify({
        targetUserId: existing.userId,
        reason: auditReason.trim(),
        before: beforeState,
        after: afterState,
      }),
    },
  })

  return NextResponse.json({ business: updatedBusiness, message: 'Provider business profile updated successfully' })
}
