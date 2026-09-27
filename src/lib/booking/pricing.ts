/**
 * Pricing utilities for booking cost calculation.
 * Both client-side preview and server-side verification use these functions.
 */

export type PricingInput = {
  pickupDate: string | Date
  returnDate: string | Date
  dailyRate: number
  weeklyRate?: number | null
  monthlyRate?: number | null
  hourlyRate?: number | null
  securityDeposit?: number | null
  deliveryCharge?: number
  setupCharge?: number
  discount?: number
  advancePercent?: number // Default 30
}

export type PricingResult = {
  rentalDays: number
  rentalCharge: number
  deliveryCharge: number
  setupCharge: number
  discount: number
  rentalSubtotal: number
  securityDeposit: number
  totalPayable: number
  advanceRequired: number
  balanceDue: number
  priceBreakdown: string
}

/**
 * Calculate the number of rental days between pickup and return dates.
 * Minimum 1 day.
 */
export function calculateRentalDays(pickupDate: string | Date, returnDate: string | Date): number {
  const pickup = new Date(pickupDate)
  const returnD = new Date(returnDate)
  const diffMs = returnD.getTime() - pickup.getTime()
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(1, days)
}

/**
 * Calculate the optimal rental charge using the best applicable rate.
 * Uses monthly rate for 28+ days, weekly rate for 7+ days, otherwise daily rate.
 */
export function calculateRentalCharge(
  days: number,
  dailyRate: number,
  weeklyRate?: number | null,
  monthlyRate?: number | null,
): number {
  // Try monthly rate for 28+ days
  if (monthlyRate && days >= 28) {
    const fullMonths = Math.floor(days / 30)
    const remainingDays = days - (fullMonths * 30)
    const monthlyTotal = fullMonths * monthlyRate
    const remainderCharge = remainingDays > 0 ? remainingDays * dailyRate : 0
    const monthlyCalc = monthlyTotal + remainderCharge

    // Only use monthly if it's actually cheaper
    const dailyCalc = days * dailyRate
    return Math.min(monthlyCalc, dailyCalc)
  }

  // Try weekly rate for 7+ days
  if (weeklyRate && days >= 7) {
    const fullWeeks = Math.floor(days / 7)
    const remainingDays = days - (fullWeeks * 7)
    const weeklyTotal = fullWeeks * weeklyRate
    const remainderCharge = remainingDays > 0 ? remainingDays * dailyRate : 0
    const weeklyCalc = weeklyTotal + remainderCharge

    const dailyCalc = days * dailyRate
    return Math.min(weeklyCalc, dailyCalc)
  }

  return days * dailyRate
}

/**
 * Full price calculation for a booking request.
 */
export function calculateBookingPricing(input: PricingInput): PricingResult {
  const rentalDays = calculateRentalDays(input.pickupDate, input.returnDate)

  const rentalCharge = calculateRentalCharge(
    rentalDays,
    input.dailyRate,
    input.weeklyRate,
    input.monthlyRate
  )

  const deliveryCharge = input.deliveryCharge || 0
  const setupCharge = input.setupCharge || 0
  const discount = input.discount || 0
  const securityDeposit = input.securityDeposit || 0
  const advancePercent = input.advancePercent ?? 30

  const rentalSubtotal = rentalCharge + deliveryCharge + setupCharge - discount
  const totalPayable = Math.max(0, rentalSubtotal)
  const advanceRequired = Math.round(totalPayable * advancePercent / 100)
  const balanceDue = totalPayable - advanceRequired

  // Build breakdown text
  const lines: string[] = []
  lines.push(`Rental: ${rentalDays} day${rentalDays !== 1 ? 's' : ''} × Rs. ${input.dailyRate.toLocaleString()} = Rs. ${rentalCharge.toLocaleString()}`)
  if (deliveryCharge > 0) lines.push(`Delivery: Rs. ${deliveryCharge.toLocaleString()}`)
  if (setupCharge > 0) lines.push(`Setup: Rs. ${setupCharge.toLocaleString()}`)
  if (discount > 0) lines.push(`Discount: -Rs. ${discount.toLocaleString()}`)
  lines.push(`Subtotal: Rs. ${totalPayable.toLocaleString()}`)
  if (securityDeposit > 0) lines.push(`Refundable deposit: Rs. ${securityDeposit.toLocaleString()}`)
  lines.push(`Advance (${advancePercent}%): Rs. ${advanceRequired.toLocaleString()}`)
  lines.push(`Balance due: Rs. ${balanceDue.toLocaleString()}`)

  return {
    rentalDays,
    rentalCharge,
    deliveryCharge,
    setupCharge,
    discount,
    rentalSubtotal: totalPayable,
    securityDeposit,
    totalPayable,
    advanceRequired,
    balanceDue,
    priceBreakdown: lines.join('\n'),
  }
}

/**
 * Validate booking dates.
 */
export function validateBookingDates(pickupDate: string | Date, returnDate: string | Date): { valid: boolean; error?: string } {
  const pickup = new Date(pickupDate)
  const returnD = new Date(returnDate)
  const now = new Date()

  if (isNaN(pickup.getTime())) return { valid: false, error: 'Invalid pickup date' }
  if (isNaN(returnD.getTime())) return { valid: false, error: 'Invalid return date' }

  // Allow pickup today
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (pickup < today) return { valid: false, error: 'Pickup date cannot be in the past' }
  if (returnD <= pickup) return { valid: false, error: 'Return date must be after pickup date' }

  const days = calculateRentalDays(pickupDate, returnDate)
  if (days > 365) return { valid: false, error: 'Rental period cannot exceed 365 days' }

  return { valid: true }
}
