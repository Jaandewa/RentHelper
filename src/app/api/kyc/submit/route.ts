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

    // In a real app we'd process the uploaded files here and save URLs
    // For now we just update the status
    await prisma.customerProfile.update({
      where: { id: customer.id },
      data: {
        kycStatus: 'pending'
      }
    })

    await prisma.kYCApproval.create({
      data: {
        customerId: customer.id,
        action: 'submitted',
        performedBy: session.user.id, // Usually an admin ID but user submits it
        notes: 'Initial submission'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
