import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// POST /api/admin/kyc/repair — Repair test customer data stuck in pending without submitted documents
export async function POST(_req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    // Find customer profiles that are marked pending but have no submitted timestamp and zero documents
    const pendingCustomers = await prisma.customerProfile.findMany({
      where: {
        kycStatus: 'pending',
        kycSubmittedAt: null,
      },
      include: {
        customerDocuments: true,
      },
    })

    const toRepair = pendingCustomers.filter(c => c.customerDocuments.length === 0)

    if (toRepair.length === 0) {
      return NextResponse.json({
        message: 'No unsubmitted test records found in pending status.',
        repairedCount: 0,
      })
    }

    const repairedIds = toRepair.map(c => c.id)

    await prisma.customerProfile.updateMany({
      where: {
        id: { in: repairedIds },
      },
      data: {
        kycStatus: 'not_submitted',
        accountStatus: 'incomplete',
      },
    })

    return NextResponse.json({
      success: true,
      message: `Repaired ${toRepair.length} test customer records back to not_submitted status.`,
      repairedCount: toRepair.length,
      repairedIds,
    })
  } catch (err: any) {
    console.error('Repair KYC error:', err)
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 })
  }
}
