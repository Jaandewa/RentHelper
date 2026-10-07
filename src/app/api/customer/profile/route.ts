import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

const ALLOWED_CUSTOMER_FIELDS = new Set([
  'image',
  'address',
  'city',
  'emergencyContact',
  'emergencyPhone',
  'allowCrossProviderShare',
])

const RESTRICTED_FIELDS = new Set([
  'id',
  'name',
  'email',
  'phone',
  'normalizedPhone',
  'phone2',
  'nicNumber',
  'nicNumberEncrypted',
  'identityType',
  'normalizedIdentityNumber',
  'customerType',
  'nationality',
  'passportIssuingCountry',
  'whatsappCountryCode',
  'phoneVerified',
  'phoneVerifiedAt',
  'kycStatus',
  'accountStatus',
  'kycSubmittedAt',
  'kycRejectionReason',
  'kycRejectionReasonCode',
  'trustScore',
  'totalBookings',
  'averageRating',
  'totalReviews',
  'role',
  'status',
  'password',
  'passwordChangedAt',
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
        customerProfile: {
          select: {
            id: true,
            address: true,
            city: true,
            emergencyContact: true,
            emergencyPhone: true,
            allowCrossProviderShare: true,
            phone: true,
            nicNumber: true,
            identityType: true,
            customerType: true,
            kycStatus: true,
            accountStatus: true,
            trustScore: true,
            totalBookings: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching customer profile:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Forbidden — Customer access required' }, { status: 403 })
    }

    const body = await req.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Server-side allowlist check & rejection of restricted fields
    const keys = Object.keys(body)
    const forbiddenKeys: string[] = []

    for (const key of keys) {
      if (RESTRICTED_FIELDS.has(key) || !ALLOWED_CUSTOMER_FIELDS.has(key)) {
        forbiddenKeys.push(key)
      }
    }

    if (forbiddenKeys.length > 0) {
      return NextResponse.json(
        {
          error: `Updating restricted profile field(s) '${forbiddenKeys.join(', ')}' is forbidden. Contact support for assistance.`,
          forbiddenFields: forbiddenKeys,
        },
        { status: 403 }
      )
    }

    const { image, address, city, emergencyContact, emergencyPhone, allowCrossProviderShare } = body

    // Update User image if provided
    if (image !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: typeof image === 'string' ? image : null },
      })
    }

    // Upsert CustomerProfile safe fields
    const profileData: any = {}
    if (address !== undefined) profileData.address = typeof address === 'string' ? address : null
    if (city !== undefined) profileData.city = typeof city === 'string' ? city : null
    if (emergencyContact !== undefined) profileData.emergencyContact = typeof emergencyContact === 'string' ? emergencyContact : null
    if (emergencyPhone !== undefined) profileData.emergencyPhone = typeof emergencyPhone === 'string' ? emergencyPhone : null
    if (allowCrossProviderShare !== undefined) profileData.allowCrossProviderShare = Boolean(allowCrossProviderShare)

    const updatedProfile = await prisma.customerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...profileData,
      },
      update: profileData,
    })

    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        customerProfile: true,
      },
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Error updating customer profile:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
