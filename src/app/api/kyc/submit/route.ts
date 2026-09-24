import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const customer = await prisma.customerProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json({ message: 'Customer profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const {
      fullName, nicNumber, dateOfBirth, address, city,
      phone, phone2, emergencyContact, emergencyPhone,
      consent
    } = body

    // Update customer profile with submitted data
    await prisma.customerProfile.update({
      where: { id: customer.id },
      data: {
        nicNumber: nicNumber || null,
        phone: phone || null,
        phone2: phone2 || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address || null,
        city: city || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        allowCrossProviderShare: consent ?? true,
        kycStatus: 'pending',
      }
    })

    // Also update user name if fullName provided
    if (fullName) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: fullName }
      })
    }

    // Create KYC audit trail
    await prisma.kYCApproval.create({
      data: {
        customerId: customer.id,
        action: 'submitted',
        performedBy: session.user.id,
        notes: `KYC submitted. Phone: ${phone || 'N/A'}. NIC: ${nicNumber || 'N/A'}`
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('KYC submit error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
