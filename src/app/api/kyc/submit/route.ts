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
      consent,
      nicFrontUrl, nicBackUrl, selfieUrl,
      nicFrontName, nicBackName, selfieName,
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

    // Update user name if fullName provided
    if (fullName) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: fullName }
      })
    }

    // Delete existing documents (for resubmission)
    await prisma.customerDocument.deleteMany({
      where: { customerId: customer.id }
    })

    // Save uploaded documents
    const docs: { customerId: string; type: string; url: string; fileName: string }[] = []

    if (nicFrontUrl) {
      docs.push({
        customerId: customer.id,
        type: 'nic_front',
        url: nicFrontUrl,
        fileName: nicFrontName || 'nic_front.jpg',
      })
    }

    if (nicBackUrl) {
      docs.push({
        customerId: customer.id,
        type: 'nic_back',
        url: nicBackUrl,
        fileName: nicBackName || 'nic_back.jpg',
      })
    }

    if (selfieUrl) {
      docs.push({
        customerId: customer.id,
        type: 'selfie_with_id',
        url: selfieUrl,
        fileName: selfieName || 'selfie.jpg',
      })
    }

    // Create document records one by one (avoid createMany issues)
    for (const doc of docs) {
      await prisma.customerDocument.create({ data: doc })
    }

    // Create KYC audit trail
    await prisma.kYCApproval.create({
      data: {
        customerId: customer.id,
        action: 'submitted',
        performedBy: session.user.id,
        notes: `KYC submitted. Phone: ${phone || 'N/A'}. NIC: ${nicNumber || 'N/A'}. Documents: ${docs.length} uploaded.`
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('KYC submit error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
