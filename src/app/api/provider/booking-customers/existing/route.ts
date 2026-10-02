import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getCustomerDisplayId } from '@/app/api/provider/customers/route'

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
    const session = await auth()
    
    if (!session?.user || (session.user.role !== 'provider' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id }
    })

    if (!business) {
      return NextResponse.json({ customers: [] })
    }

    // Find distinct customer IDs who have booked with this business
    const distinctBookings = await prisma.booking.findMany({
      where: { businessId: business.id },
      select: { customerId: true },
      distinct: ['customerId']
    })
    
    const customerIds = distinctBookings.map(b => b.customerId)
    
    if (customerIds.length === 0) {
      return NextResponse.json({ customers: [] })
    }

    // Fetch customer profiles for those IDs
    const customers = await prisma.customerProfile.findMany({
      where: { id: { in: customerIds } },
      include: { user: true }
    })

    const results = await Promise.all(customers.map(async (customer) => {
      // Fetch most recent booking for this customer and business
      const lastBooking = await prisma.booking.findFirst({
        where: {
          businessId: business.id,
          customerId: customer.id
        },
        orderBy: { createdAt: 'desc' },
        include: {
          bookingItems: {
            include: {
              item: true
            }
          }
        }
      })

      return {
        id: customer.id,
        displayId: getCustomerDisplayId(customer.id),
        fullName: customer.user.name || 'Unknown',
        maskedPhone: maskPhone(customer.phone),
        maskedEmail: maskEmail(customer.user.email),
        customerType: customer.customerType,
        kycStatus: customer.kycStatus,
        trustScore: customer.trustScore,
        lastBooking: lastBooking ? {
          id: lastBooking.id,
          status: lastBooking.status,
          date: lastBooking.createdAt,
          itemName: lastBooking.bookingItems?.[0]?.item?.name || 'Unknown Item'
        } : null
      }
    }))

    return NextResponse.json({ customers: results })
  } catch (error) {
    console.error('Error fetching existing customers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
