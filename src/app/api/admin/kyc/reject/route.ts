import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { sendKycRejectedWhatsApp } from '@/lib/notifications/whatsapp'

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const { customerId, reason } = body

    if (!customerId) {
      return NextResponse.json({ message: 'customerId is required' }, { status: 400 })
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json({ message: 'Rejection reason is mandatory' }, { status: 400 })
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
        kycStatus: 'rejected',
        kycRejectionReason: reason.trim(),
      },
    })

    // Log KYC audit trail
    await prisma.kYCApproval.create({
      data: {
        customerId,
        action: 'rejected',
        performedBy: session!.user.id,
        notes: reason.trim(),
      },
    })

    // Create in-app notification
    if (customer.userId) {
      await prisma.notification.create({
        data: {
          userId: customer.userId,
          type: 'kyc_status',
          channel: 'in_app',
          subject: 'KYC Verification Rejected',
          body: `Your identity verification was rejected. Reason: ${reason.trim()}. Please resubmit corrected documents.`,
          scheduledAt: new Date(),
          status: 'sent',
        },
      }).catch(console.error)
    }

    // Attempt WhatsApp notification safely (non-blocking)
    if (customer.phone) {
      const name = customer.user?.name || 'Customer'
      sendKycRejectedWhatsApp({ phoneNumber: customer.phone, customerName: name, reason: reason.trim() }).catch(err => {
        console.error('[WhatsApp rejection error]', err)
      })
    }

    return NextResponse.json({ success: true, message: 'Customer KYC rejected successfully' })
  } catch (err: any) {
    console.error('Reject KYC error:', err)
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 })
  }
}
