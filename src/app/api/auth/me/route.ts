import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        image: true,
        customerProfile: {
          select: {
            id: true,
            kycStatus: true,
            kycRejectionReason: true,
            trustScore: true,
            totalBookings: true,
            phone: true,
          }
        },
        businessProfile: {
          select: {
            id: true,
            name: true,
            approvalStatus: true,
            isActive: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
