import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    })

    if (role === 'customer') {
      await prisma.customerProfile.create({ data: { userId: user.id } })
    }

    // For providers: create a Business stub (pending) + Free Trial subscription
    if (role === 'provider') {
      // Get site settings to determine trial length + plan details
      const siteSettings = await prisma.siteSettings.findUnique({ where: { id: '1' } })
      const trialDays = siteSettings?.defaultTrialDays ?? 30
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)

      // Create a pending business stub
      const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      const business = await prisma.business.create({
        data: {
          userId: user.id,
          name,
          slug,
          approvalStatus: 'approved', // providers auto-approved; only customers need KYC review
        },
      })

      // Create free trial subscription
      await prisma.subscription.create({
        data: {
          businessId: business.id,
          status: 'trial',
          planName: 'Free Trial',
          pricePerMonth: 0,
          maxItems: 5,
          trialEndsAt,
        },
      })
    }

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
