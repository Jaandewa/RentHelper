import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

const OTP_PURPOSE = 'PROVIDER_CHANGE_WHATSAPP'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || (session.user as any).role !== 'provider') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (business) {
      const userSessionPrefix = `${session.user.id}:${business.id}:`
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
