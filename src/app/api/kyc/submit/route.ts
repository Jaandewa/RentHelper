import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { normalizeIdentityNumber } from '@/lib/phone'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    let customer = await prisma.customerProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      customer = await prisma.customerProfile.create({
        data: {
          userId: session.user.id,
          kycStatus: 'not_submitted',
          accountStatus: 'incomplete',
        }
      })
    }

    const body = await req.json()
    const {
      fullName, nicNumber, dateOfBirth, address, city,
      phone, phone2, emergencyContact, emergencyPhone,
      consent,
      nicFrontUrl, nicBackUrl, selfieUrl,
      nicFrontName, nicBackName, selfieName,
    } = body

    if (!nicFrontUrl || !nicBackUrl) {
      return NextResponse.json(
        { message: 'Please upload both front and back photos of your ID document.' },
        { status: 400 }
      )
    }

    // ── Identity number uniqueness check ──────────────────────────────
    let identityType: string | null = null
    let normalizedIdentityNumber: string | null = null

    if (nicNumber) {
      const normalized = normalizeIdentityNumber(nicNumber)
      if (normalized) {
        // Detect type: old NIC (9 digits + V/X), new NIC (12 digits), or passport
        if (/^\d{9}[VX]$/i.test(normalized) || /^\d{12}$/.test(normalized)) {
          identityType = 'NIC'
        } else {
          identityType = 'PASSPORT'
        }
        normalizedIdentityNumber = normalized

        // Check uniqueness (exclude current customer)
        const existingIdentity = await prisma.customerProfile.findFirst({
          where: {
            identityType,
            normalizedIdentityNumber: normalized,
            id: { not: customer.id },
          },
        })

        // Also check legacy nicNumber field
        if (!existingIdentity) {
          const legacyMatch = await prisma.customerProfile.findFirst({
            where: {
              nicNumber: { equals: normalized, mode: 'insensitive' },
              id: { not: customer.id },
            },
          })
          if (legacyMatch) {
            return NextResponse.json(
              { message: 'This identity document is already associated with another account. Please use a different valid document or contact support if you believe this is an error.' },
              { status: 409 }
            )
          }
        } else {
          return NextResponse.json(
            { message: 'This identity document is already associated with another account. Please use a different valid document or contact support if you believe this is an error.' },
            { status: 409 }
          )
        }
      }
    }

    // Update customer profile with submitted data
    await prisma.customerProfile.update({
      where: { id: customer.id },
      data: {
        nicNumber: nicNumber || null,
        identityType,
        normalizedIdentityNumber,
        phone: phone || null,
        phone2: phone2 || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address || null,
        city: city || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        allowCrossProviderShare: consent ?? true,
        kycStatus: 'pending',
        accountStatus: 'pending_approval',
        kycSubmittedAt: new Date(),
        kycRejectionReason: null,
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

    // Create document records one by one
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

    return NextResponse.json({
      success: true,
      redirectTo: '/customer/pending-approval',
    })
  } catch (error) {
    console.error('KYC submit error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
