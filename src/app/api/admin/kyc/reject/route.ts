import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { sendKycDecisionNotification } from '@/lib/notifications/service'
import { VALID_REASON_CODES, getReasonByCode, buildFinalReason } from '@/lib/kyc-rejection-reasons'

const MAX_NOTE_LENGTH = 500

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const { customerId, reasonCode, additionalNote } = body

    if (!customerId) {
      return NextResponse.json({ message: 'customerId is required' }, { status: 400 })
    }

    // Validate reason code against server-side allow-list
    if (!reasonCode || !VALID_REASON_CODES.includes(reasonCode)) {
      return NextResponse.json({ message: 'Please select a valid rejection reason.' }, { status: 400 })
    }

    // If OTHER, additional note is mandatory
    if (reasonCode === 'OTHER' && (!additionalNote || !additionalNote.trim())) {
      return NextResponse.json({ message: 'Additional note is required when selecting "Other reason".' }, { status: 400 })
    }

    // Validate additional note length
    const sanitizedNote = additionalNote?.trim().slice(0, MAX_NOTE_LENGTH) || null

    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    if (!customer) {
      return NextResponse.json({ message: 'Customer profile not found' }, { status: 404 })
    }

    // Ensure KYC is in a rejectable state
    if (customer.kycStatus === 'rejected') {
      return NextResponse.json({ message: 'This KYC submission has already been rejected.' }, { status: 400 })
    }

    // Build final customer-facing reason server-side
    const finalReason = buildFinalReason(reasonCode, sanitizedNote || undefined)
    const reasonLabel = getReasonByCode(reasonCode)?.label || reasonCode

    // Update customer KYC status
    await prisma.customerProfile.update({
      where: { id: customerId },
      data: {
        kycStatus: 'rejected',
        kycRejectionReason: finalReason,
        kycRejectionReasonCode: reasonCode,
      },
    })

    // Log KYC audit trail
    await prisma.kYCApproval.create({
      data: {
        customerId,
        action: 'rejected',
        performedBy: session!.user.id,
        notes: sanitizedNote ? `${reasonLabel}. ${sanitizedNote}` : reasonLabel,
      },
    })

    // Unified notification: in-app + WhatsApp delivery log
    sendKycDecisionNotification(customerId, 'rejected', finalReason).catch(e =>
      console.error('[Notification] KYC rejection notification error:', e)
    )

    return NextResponse.json({ success: true, message: 'Customer KYC rejected successfully' })
  } catch (err: any) {
    console.error('Reject KYC error:', err)
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 })
  }
}
