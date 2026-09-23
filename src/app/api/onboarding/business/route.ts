import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const { name, phone, address, city, registrationNumber, currency, advancePaymentPercent, description } = data
    
    if (!name || !phone || !city) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    await prisma.business.upsert({
      where: { userId: session.user.id },
      update: {
        name,
        phone,
        address,
        city,
        registrationNumber,
        currency,
        advancePaymentPercent: Number(advancePaymentPercent),
        description,
        onboardingStep: 2
      },
      create: {
        userId: session.user.id,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6),
        phone,
        address,
        city,
        registrationNumber,
        currency,
        advancePaymentPercent: Number(advancePaymentPercent),
        description,
        onboardingStep: 2
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
