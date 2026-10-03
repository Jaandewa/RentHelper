import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { sendKycDecisionNotification, queueEventNotifications } from '@/lib/notifications/service'

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const { customerId, adminNote } = body

    if (!customerId) {
      return NextResponse.json({ message: 'customerId is required' }, { status: 400 })
    }

    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    if (!customer) {
      return NextResponse.json({ message: 'Customer profile not found' }, { status: 404 })
    }

    // Update customer KYC status
    await prisma.customerProfile.update({
      where: { id: customerId },
      data: {
        kycStatus: 'verified',
        accountStatus: 'active',
        kycRejectionReason: null,
      },
    })

    // Log KYC audit trail
    await prisma.kYCApproval.create({
      data: {
        customerId,
        action: 'verified',
        performedBy: session!.user.id,
        notes: adminNote || 'KYC approved by admin',
      },
    })

    // Unified notification: in-app + WhatsApp delivery log
    sendKycDecisionNotification(customerId, 'approved').catch(e =>
      console.error('[Notification] KYC approval notification error:', e)
    )

    queueEventNotifications({
      eventType: 'KYC_APPROVED',
      entityType: 'KYC',
      entityId: customerId,
      recipients: [{
        userId: customerId,
        type: 'CUSTOMER',
        phone: (customer as any).phone || null,
        email: customer.user?.email || null,
        name: customer.user?.name || 'Customer'
      }],
      metadata: {
        customerName: customer.user?.name || 'Customer',
        kycStatus: 'verified'
      }
    }).catch(() => {})

    return NextResponse.json({ success: true, message: 'Customer KYC approved successfully' })
  } catch (err: any) {
    console.error('Approve KYC error:', err)
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 })
  }
}
