import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCustomerDisplayId } from '@/app/api/provider/customers/route'
import { normalizeIdentityNumber } from '@/lib/phone'
import { requireVerifiedProviderAccess } from '@/lib/provider-guard'

export const runtime = 'nodejs'

function maskPhone(phone: string | null): string {
  if (!phone) return 'N/A'
  if (phone.length <= 4) return '***' + phone.slice(-2)
  return phone.slice(0, 3) + '*'.repeat(Math.max(phone.length - 5, 3)) + phone.slice(-2)
}

function maskEmail(email: string | null): string {
  if (!email) return 'N/A'
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const masked = local.slice(0, 2) + '*'.repeat(Math.max(local.length - 2, 3))
  return `${masked}@${domain}`
}

export async function GET(req: Request) {
  try {
    const { error } = await requireVerifiedProviderAccess()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')

    if (!q || q.trim() === '') {
      return NextResponse.json({ customers: [] })
    }

    const searchString = q.trim()
    const normalizedSearch = normalizeIdentityNumber(searchString)
    const cleanSearch = searchString.toLowerCase().replace(/^cus-/, '')

    // Build OR conditions for search
    const orConditions: any[] = [
      { user: { name: { contains: searchString, mode: 'insensitive' } } },
      { user: { email: { contains: searchString, mode: 'insensitive' } } },
      { phone: { contains: searchString, mode: 'insensitive' } },
      { normalizedPhone: { contains: searchString, mode: 'insensitive' } },
      { id: { contains: cleanSearch, mode: 'insensitive' } },
    ]

    // Search identity fields: normalizedIdentityNumber AND legacy nicNumber
    if (normalizedSearch) {
      orConditions.push(
        { normalizedIdentityNumber: { equals: normalizedSearch, mode: 'insensitive' } },
        { nicNumber: { contains: searchString, mode: 'insensitive' } },
      )
    }

    const customers = await prisma.customerProfile.findMany({
      where: {
        user: {
          role: { in: ['customer', 'CUSTOMER', 'Customer'] },
        },
        OR: orConditions,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      take: 15,
    })

    const safeResults = customers.map(customer => ({
      id: customer.id,
      displayId: getCustomerDisplayId(customer.id),
      fullName: customer.user.name || 'Unknown',
      maskedPhone: maskPhone(customer.phone),
      maskedEmail: maskEmail(customer.user.email),
      customerType: customer.customerType || 'LOCAL',
      identityType: customer.identityType || null,
      kycStatus: customer.kycStatus,
      trustScore: customer.trustScore,
    }))

    return NextResponse.json({ customers: safeResults })
  } catch (error) {
    console.error('Error searching booking customers:', error)
    return NextResponse.json({ customers: [], error: 'Internal server error' }, { status: 500 })
  }
}
