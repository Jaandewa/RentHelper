import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuthenticatedProviderRecoveryAccess } from '@/lib/provider-guard'

const OTP_PURPOSE = 'PROVIDER_CHANGE_WHATSAPP'

export async function POST(req: NextRequest) {
  try {
    const { error, user: guardUser, business: guardBusiness } = await requireAuthenticatedProviderRecoveryAccess()
    if (error) return error

    const business = guardBusiness

    if (business) {
      const userSessionPrefix = `${guardUser.id}:${business.id}:`
      await prisma.otpChallenge.updateMany({
        where: {
          purpose: OTP_PURPOSE,
          sessionToken: { startsWith: userSessionPrefix },
          usedAt: null,
        },
        data: { usedAt: new Date() },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Provider WhatsApp Change Cancel] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
