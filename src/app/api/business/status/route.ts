import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

import { canBypassPhoneVerification } from '@/lib/verification-exception'

// GET /api/business/status — returns current provider's approval status + subscription
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    include: { subscription: true },
  })

  if (!business) {
    return NextResponse.json({ approvalStatus: null, subscription: null })
  }

  const isBypassed = !business.phoneVerified && (await canBypassPhoneVerification(session.user.id, 'PROVIDER_PHONE'))

  return NextResponse.json({
    id: business.id,
    name: business.name,
    phone: business.phone,
    normalizedPhone: business.normalizedPhone,
    phoneVerified: business.phoneVerified || isBypassed,
    phoneVerifiedAt: business.phoneVerifiedAt,
    approvalStatus: business.approvalStatus,
    subscription: business.subscription,
  })
}
