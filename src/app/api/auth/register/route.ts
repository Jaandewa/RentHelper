import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { verifyVerificationToken, normalizeSriLankanPhone } from '@/lib/otp'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, role, whatsappNumber, registrationVerificationToken } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
    }

    // ── Require WhatsApp OTP verification for both customer and provider ──
    let verifiedPhone: string | undefined

    if (role === 'customer' || role === 'provider') {
      if (!registrationVerificationToken || !whatsappNumber) {
        return NextResponse.json(
          { message: 'WhatsApp number verification is required before continuing.' },
          { status: 400 }
        )
      }

      // Determine expected purpose based on role
      const expectedPurpose = role === 'provider'
        ? 'PROVIDER_REGISTRATION_WHATSAPP'
        : 'REGISTRATION_WHATSAPP'

      // Verify server-signed token
      const tokenPayload = verifyVerificationToken(registrationVerificationToken, [expectedPurpose])
      if (!tokenPayload) {
        return NextResponse.json(
          { message: 'Verification token is invalid or expired. Please verify your WhatsApp number again.' },
          { status: 400 }
        )
      }

      // Normalize submitted phone and verify it matches the token
      const normalizedSubmitted = normalizeSriLankanPhone(whatsappNumber)
      if (!normalizedSubmitted || normalizedSubmitted !== tokenPayload.phone) {
        return NextResponse.json(
          { message: 'WhatsApp number does not match the verified number. Please verify again.' },
          { status: 400 }
        )
      }

      // Verify the challenge exists and is verified + not yet used for registration
      const challenge = await prisma.otpChallenge.findUnique({
        where: { id: tokenPayload.challengeId },
      })

      if (!challenge || !challenge.verifiedAt || challenge.usedAt) {
        return NextResponse.json(
          { message: 'Verification has expired or was already used. Please verify your WhatsApp number again.' },
          { status: 400 }
        )
      }

      // Consume the challenge atomically
      await prisma.otpChallenge.update({
        where: { id: tokenPayload.challengeId },
        data: { usedAt: new Date() },
      })

      verifiedPhone = tokenPayload.phone
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
      await prisma.customerProfile.create({
        data: {
          userId: user.id,
          phone: verifiedPhone,
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
        },
      })
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
          phone: verifiedPhone,
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
          approvalStatus: 'approved',
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
