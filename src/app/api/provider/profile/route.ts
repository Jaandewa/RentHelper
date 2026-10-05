import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

const ALLOWED_PROVIDER_FIELDS = new Set([
  'logo',
  'description',
  'address',
  'city',
  'depositPolicy',
  'cancellationPolicy',
  'operatingHours',
  'pickupInstructions',
  'returnInstructions',
])

const RESTRICTED_PROVIDER_FIELDS = new Set([
  'id',
  'userId',
  'name',
  'slug',
  'phone',
  'normalizedPhone',
  'phoneVerified',
  'phoneVerifiedAt',
  'registrationNumber',
  'currency',
  'timezone',
  'advancePaymentPercent',
  'isActive',
  'onboardingStep',
  'approvalStatus',
  'approvalNote',
  'approvedBy',
  'approvedAt',
  'averageRating',
  'totalReviews',
  'role',
  'status',
  'password',
  'passwordChangedAt',
  'email',
  'createdAt',
  'updatedAt',
])

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        businessProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user, business: user.businessProfile })
  } catch (error) {
    console.error('Error fetching provider profile:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'provider') {
      return NextResponse.json({ error: 'Forbidden — Provider access required' }, { status: 403 })
    }

    const body = await req.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Server-side allowlist check & rejection of restricted fields
    const keys = Object.keys(body)
    const forbiddenKeys: string[] = []

    for (const key of keys) {
      if (RESTRICTED_PROVIDER_FIELDS.has(key) || !ALLOWED_PROVIDER_FIELDS.has(key)) {
        forbiddenKeys.push(key)
      }
    }

    if (forbiddenKeys.length > 0) {
      return NextResponse.json(
        {
          error: `Updating restricted provider field(s) '${forbiddenKeys.join(', ')}' is forbidden. Contact support for assistance.`,
          forbiddenFields: forbiddenKeys,
        },
        { status: 403 }
      )
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    const { logo, description, address, city, depositPolicy, cancellationPolicy, operatingHours, pickupInstructions, returnInstructions } = body

    const updateData: any = {}
    if (logo !== undefined) updateData.logo = typeof logo === 'string' ? logo : null
    if (description !== undefined) updateData.description = typeof description === 'string' ? description : null
    if (address !== undefined) updateData.address = typeof address === 'string' ? address : null
    if (city !== undefined) updateData.city = typeof city === 'string' ? city : null

    // For operatingHours, pickupInstructions, returnInstructions, map them into depositPolicy/cancellationPolicy if separate or append cleanly
    let newDepositPolicy = depositPolicy !== undefined ? (typeof depositPolicy === 'string' ? depositPolicy : '') : business.depositPolicy || ''
    let newCancellationPolicy = cancellationPolicy !== undefined ? (typeof cancellationPolicy === 'string' ? cancellationPolicy : '') : business.cancellationPolicy || ''

    if (operatingHours !== undefined || pickupInstructions !== undefined || returnInstructions !== undefined) {
      // Store operating hours & pickup instructions in depositPolicy/cancellationPolicy if present
      const instructions = [
        operatingHours ? `Operating Hours: ${operatingHours}` : null,
        pickupInstructions ? `Pickup Instructions: ${pickupInstructions}` : null,
        returnInstructions ? `Return Instructions: ${returnInstructions}` : null,
      ].filter(Boolean).join('\n')

      if (instructions) {
        if (newDepositPolicy) {
          newDepositPolicy = `${newDepositPolicy}\n\n${instructions}`
        } else {
          newDepositPolicy = instructions
        }
      }
    }

    if (depositPolicy !== undefined || operatingHours !== undefined || pickupInstructions !== undefined || returnInstructions !== undefined) {
      updateData.depositPolicy = newDepositPolicy
    }
    if (cancellationPolicy !== undefined) {
      updateData.cancellationPolicy = newCancellationPolicy
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: updateData,
    })

    return NextResponse.json({
      message: 'Provider profile updated successfully',
      business: updatedBusiness,
    })
  } catch (error) {
    console.error('Error updating provider profile:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
