import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const { customerId, message } = body

    if (!customerId) {
      return NextResponse.json({ message: 'customerId is required' }, { status: 400 })
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ message: 'Information request message is required' }, { status: 400 })
    }

    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      include: { user: { select: { id: true, name: true } } },
    })

    if (!customer) {
      return NextResponse.json({ message: 'Customer profile not found' }, { status: 404 })
    }

    // Update customer KYC status
    await prisma.customerProfile.update({
      where: { id: customerId },
      data: {
        kycStatus: 'needs_more_info',
        kycRejectionReason: message.trim(),
      },
    })

    // Log KYC audit trail
    await prisma.kYCApproval.create({
      data: {
        customerId,
        action: 'needs_more_info',
        performedBy: session!.user.id,
        notes: message.trim(),
      },
    })

    // Create in-app notification
    if (customer.userId) {
      await prisma.notification.create({
        data: {
          userId: customer.userId,
          type: 'kyc_status',
          channel: 'in_app',
          subject: 'KYC: Additional Information Requested',
          body: message.trim(),
          scheduledAt: new Date(),
          status: 'sent',
        },
      }).catch(console.error)
    }

    return NextResponse.json({ success: true, message: 'Requested additional information successfully' })
  } catch (err: any) {
    console.error('Request info KYC error:', err)
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 })
  }
}
