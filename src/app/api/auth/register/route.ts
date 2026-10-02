import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { verifyVerificationToken, normalizeSriLankanPhone } from '@/lib/otp'
import { normalizePhoneInternational, normalizeIdentityNumber } from '@/lib/phone'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      name, email, password, role, whatsappNumber, registrationVerificationToken,
      customerType = 'LOCAL', whatsappCountryCode = '94', identityType: reqIdentityType,
      identityNumber, nationality, passportIssuingCountry, address, countryCode
    } = body

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
      let normalizedSubmitted: string | undefined = undefined
      if (countryCode && countryCode !== 'LK') {
        const parsed = parsePhoneNumberFromString(whatsappNumber, countryCode as any)
        if (parsed?.isValid()) {
          normalizedSubmitted = parsed.number.replace('+', '')
        }
      } else {
        const parsed = parsePhoneNumberFromString(whatsappNumber, 'LK')
        if (parsed?.isValid()) {
          normalizedSubmitted = parsed.number.replace('+', '')
        }
        if (!normalizedSubmitted) {
          normalizedSubmitted = normalizeSriLankanPhone(whatsappNumber) || undefined
        }
      }

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

    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existingUser) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 })
    }

    // ── Check phone uniqueness ────────────────────────────────────────
    let normalizedPhone: string | undefined
    if (verifiedPhone) {
      normalizedPhone = normalizePhoneInternational(verifiedPhone) || verifiedPhone
      
      const existingCustPhone = await prisma.customerProfile.findFirst({
        where: { normalizedPhone },
      })
      const existingBizPhone = await prisma.business.findFirst({
        where: { normalizedPhone },
      })
      if (existingCustPhone || existingBizPhone) {
        return NextResponse.json(
          { message: 'This WhatsApp number is already associated with another account.' },
          { status: 409 }
        )
      }
    }

    let finalIdentityType = reqIdentityType
    let normalizedIdentityNumber: string | undefined = undefined

    if (role === 'customer') {
      if (customerType === 'FOREIGN' && identityNumber) {
        finalIdentityType = 'PASSPORT'
        if (!nationality || !passportIssuingCountry) {
          return NextResponse.json({ message: 'Nationality and Passport Issuing Country are required for foreign customers.' }, { status: 400 })
        }
      } else if (customerType === 'LOCAL' && identityNumber) {
        const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/
        if (!nicRegex.test(identityNumber)) {
          return NextResponse.json({ message: 'Invalid NIC format.' }, { status: 400 })
        }
        finalIdentityType = 'NIC'
      }

      if (identityNumber) {
        normalizedIdentityNumber = normalizeIdentityNumber(identityNumber)
        const existingId = await prisma.customerProfile.findFirst({
          where: { identityType: finalIdentityType, normalizedIdentityNumber }
        })
        if (existingId) {
          return NextResponse.json({ message: 'This identity number is already registered.' }, { status: 409 })
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email: normalizedEmail, password: hashedPassword, role },
    })

    if (role === 'customer') {
      await prisma.customerProfile.create({
        data: {
          userId: user.id,
          phone: verifiedPhone,
          normalizedPhone,
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
          customerType,
          whatsappCountryCode,
          nationality: customerType === 'FOREIGN' ? nationality : null,
          passportIssuingCountry: customerType === 'FOREIGN' ? passportIssuingCountry : null,
          address,
          identityType: identityNumber ? finalIdentityType : undefined,
          normalizedIdentityNumber: identityNumber ? normalizedIdentityNumber : undefined,
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
          normalizedPhone,
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
