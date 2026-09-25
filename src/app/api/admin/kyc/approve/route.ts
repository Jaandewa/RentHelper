import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { sendKycApprovedWhatsApp } from '@/lib/notifications/whatsapp'

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

    // Create in-app notification if needed
    if (customer.userId) {
      await prisma.notification.create({
        data: {
          userId: customer.userId,
          type: 'kyc_status',
          channel: 'in_app',
          subject: 'KYC Approved! 🎉',
          body: 'Your account identity has been verified. You can now browse items and request rental bookings.',
          scheduledAt: new Date(),
          status: 'sent',
        },
      }).catch(console.error)
    }

    // Attempt WhatsApp notification safely (non-blocking)
    if (customer.phone) {
      const name = customer.user?.name || 'Customer'
      sendKycApprovedWhatsApp({ phoneNumber: customer.phone, customerName: name }).catch(err => {
        console.error('[WhatsApp approval error]', err)
      })
    }

    return NextResponse.json({ success: true, message: 'Customer KYC approved successfully' })
  } catch (err: any) {
    console.error('Approve KYC error:', err)
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 })
  }
}
