import prisma from '@/lib/prisma'

export type AvailabilityResult = {
  available: boolean
  conflicts: Array<{
    bookingNumber: string
    pickupDate: Date
    returnDate: Date
    status: string
  }>
}

/**
 * Check if an item is available for the requested date range.
 * Looks for conflicting bookings that overlap with the requested dates.
 * Only confirmed, active, pending_provider_approval, and awaiting_advance_payment
 * bookings are considered conflicts.
 */
export async function checkItemAvailability(
  itemId: string,
  pickupDate: Date,
  returnDate: Date,
  excludeBookingId?: string
): Promise<AvailabilityResult> {
  const blockingStatuses = [
    'confirmed',
    'active',
    'pending_provider_approval',
    'awaiting_advance_payment',
    'pending_confirmation',
  ]

  const whereClause: any = {
    booking: {
      status: { in: blockingStatuses },
      AND: [
        { pickupDate: { lt: returnDate } },
        { returnDate: { gt: pickupDate } },
      ],
    },
    itemId,
  }

  // Exclude a specific booking (useful when re-checking during accept)
  if (excludeBookingId) {
    whereClause.booking.id = { not: excludeBookingId }
  }

  const conflictingItems = await prisma.bookingItem.findMany({
    where: whereClause,
    include: {
      booking: {
        select: {
          id: true,
          bookingNumber: true,
          pickupDate: true,
          returnDate: true,
          status: true,
        },
      },
    },
  })

  const conflicts = conflictingItems.map(ci => ({
    bookingNumber: ci.booking.bookingNumber,
    pickupDate: ci.booking.pickupDate,
    returnDate: ci.booking.returnDate,
    status: ci.booking.status,
  }))

  return {
    available: conflicts.length === 0,
    conflicts,
  }
}

/**
 * Release expired payment holds.
 * Bookings in 'awaiting_advance_payment' status past their holdExpiresAt are expired.
 */
export async function releaseExpiredHolds(): Promise<number> {
  const now = new Date()

  const result = await prisma.booking.updateMany({
    where: {
      status: 'awaiting_advance_payment',
      holdExpiresAt: { lt: now },
      holdStatus: 'active',
    },
    data: {
      status: 'payment_expired',
      holdStatus: 'expired',
    },
  })

  return result.count
}
