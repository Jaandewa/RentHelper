import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// PATCH /api/admin/customers/[id]/edit — Admin edit customer details with audit log
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const { name, address, city, emergencyContact, emergencyPhone, nationality, auditReason } = body

  if (!auditReason || typeof auditReason !== 'string' || !auditReason.trim()) {
    return NextResponse.json({ message: 'Mandatory audit reason is required for administrative profile changes.' }, { status: 400 })
  }

  const existing = await prisma.customerProfile.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  if (!existing) {
    return NextResponse.json({ message: 'Customer profile not found' }, { status: 404 })
  }

  const beforeState = {
    userName: existing.user.name,
    address: existing.address,
    city: existing.city,
    emergencyContact: existing.emergencyContact,
    emergencyPhone: existing.emergencyPhone,
    nationality: existing.nationality,
  }

  // Update user name if provided
  if (name && name.trim() !== existing.user.name) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: { name: name.trim() },
    })
  }

  // Update Customer Profile fields
  const updatedProfile = await prisma.customerProfile.update({
    where: { id },
    data: {
      address: address !== undefined ? address : existing.address,
      city: city !== undefined ? city : existing.city,
      emergencyContact: emergencyContact !== undefined ? emergencyContact : existing.emergencyContact,
      emergencyPhone: emergencyPhone !== undefined ? emergencyPhone : existing.emergencyPhone,
      nationality: nationality !== undefined ? nationality : existing.nationality,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  const afterState = {
    userName: updatedProfile.user.name,
    address: updatedProfile.address,
    city: updatedProfile.city,
    emergencyContact: updatedProfile.emergencyContact,
    emergencyPhone: updatedProfile.emergencyPhone,
    nationality: updatedProfile.nationality,
  }

  // Record audit log entry
  await prisma.activityLog.create({
    data: {
      userId: session!.user.id,
      action: 'ADMIN_EDIT_CUSTOMER_PROFILE',
      entityType: 'CUSTOMER_PROFILE',
      entityId: id,
      details: JSON.stringify({
        targetUserId: existing.userId,
        reason: auditReason.trim(),
        before: beforeState,
        after: afterState,
      }),
    },
  })

  return NextResponse.json({ customer: updatedProfile, message: 'Customer profile updated successfully' })
}
