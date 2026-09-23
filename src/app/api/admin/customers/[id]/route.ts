import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// GET /api/admin/customers/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const customer = await prisma.customerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, status: true, createdAt: true } },
      customerDocuments: true,
      bookings: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, bookingNumber: true, status: true, totalAmount: true, createdAt: true },
      },
      kycApprovals: { orderBy: { createdAt: 'desc' } },
      _count: { select: { bookings: true } },
    },
  })

  if (!customer) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  return NextResponse.json({ customer })
}

// PATCH /api/admin/customers/[id] — approve/reject KYC, suspend user
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const { kycStatus, kycRejectionReason, userStatus, suspendReason, suspendedUntil } = body

  // Update KYC status on profile
  if (kycStatus) {
    await prisma.customerProfile.update({
      where: { id },
      data: { kycStatus, kycRejectionReason: kycRejectionReason || null },
    })

    // Log the KYC action
    await prisma.kYCApproval.create({
      data: {
        customerId: id,
        action: kycStatus,
        performedBy: session!.user.id,
        notes: kycRejectionReason,
      },
    })
  }

  // Update user account status
  if (userStatus) {
    const customer = await prisma.customerProfile.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (customer) {
      await prisma.user.update({
        where: { id: customer.userId },
        data: {
          status: userStatus,
          suspendReason: suspendReason || null,
          suspendedUntil: suspendedUntil ? new Date(suspendedUntil) : null,
        },
      })
    }
  }

  return NextResponse.json({ message: 'Updated successfully' })
}
