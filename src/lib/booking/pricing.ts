/**
 * Pricing utilities for booking cost calculation.
 * Both client-side preview and server-side verification use these functions.
 */

export type PricingInput = {
  pickupDate: string | Date
  returnDate: string | Date
  pickupTime?: string
  returnTime?: string
  dailyRate: number
  weeklyRate?: number | null
  monthlyRate?: number | null
  hourlyRate?: number | null
  securityDeposit?: number | null
  deliveryCharge?: number
  setupCharge?: number
  discount?: number
  advancePercent?: number // Default 30
  // Foreign customer pricing
  customerType?: 'LOCAL' | 'FOREIGN' | string | null
  foreignDailyRate?: number | null
  foreignWeeklyRate?: number | null
  foreignMonthlyRate?: number | null
  foreignHourlyRate?: number | null
  foreignSecurityDeposit?: number | null
}

export type PricingResult = {
  rentalDays: number
  durationHours: number
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
  appliedRateType: 'LOCAL' | 'FOREIGN' | 'FOREIGN_FALLBACK_TO_LOCAL'
  appliedDailyRate: number
}

/**
 * Combine a date string and optional time string into a single Date.
 * If time is missing, defaults to "10:00".
 * Uses local-time parsing (no UTC shift).
 */
export function combineDateAndTime(date: string, time?: string): Date {
  const safeTime = time && time.trim() ? time.trim() : '10:00'
  // Parse as local time: "YYYY-MM-DDTHH:mm:00"
  const result = new Date(`${date}T${safeTime}:00`)
  if (isNaN(result.getTime())) {
    // Fallback: parse date only and set time manually
    const d = new Date(date)
    const [h, m] = safeTime.split(':').map(Number)
    d.setHours(h || 10, m || 0, 0, 0)
    return d
  }
  return result
}

/**
 * Calculate the number of rental days between pickup and return date+time.
 * Same-day rentals with a positive time gap count as 1 day minimum.
 */
export function calculateRentalDays(
  pickupDate: string | Date,
  returnDate: string | Date,
  pickupTime?: string,
  returnTime?: string,
): number {
  let pickupDT: Date
  let returnDT: Date

  if (typeof pickupDate === 'string' && typeof returnDate === 'string') {
    pickupDT = combineDateAndTime(pickupDate, pickupTime)
    returnDT = combineDateAndTime(returnDate, returnTime)
  } else {
    pickupDT = new Date(pickupDate)
    returnDT = new Date(returnDate)
  }

  const diffMs = returnDT.getTime() - pickupDT.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  // If within 24 hours, count as 1 day
  if (diffHours > 0 && diffHours <= 24) {
    return 1
  }

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(1, days)
}

/**
 * Calculate the duration in hours between pickup and return.
 */
export function calculateDurationHours(
  pickupDate: string,
  returnDate: string,
  pickupTime?: string,
  returnTime?: string,
): number {
  const pickupDT = combineDateAndTime(pickupDate, pickupTime)
  const returnDT = combineDateAndTime(returnDate, returnTime)
  const diffMs = returnDT.getTime() - pickupDT.getTime()
  return Math.max(0, diffMs / (1000 * 60 * 60))
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
 * Determine effective pricing rates based on customer type.
 * Foreign customers get foreign rates if configured, otherwise fallback to local.
 */
function resolveEffectiveRates(input: PricingInput): {
  effectiveDailyRate: number
  effectiveWeeklyRate: number | null | undefined
  effectiveMonthlyRate: number | null | undefined
  effectiveDeposit: number | null | undefined
  appliedRateType: 'LOCAL' | 'FOREIGN' | 'FOREIGN_FALLBACK_TO_LOCAL'
} {
  let effectiveDailyRate = input.dailyRate
  let effectiveWeeklyRate = input.weeklyRate
  let effectiveMonthlyRate = input.monthlyRate
  let effectiveDeposit = input.securityDeposit
  let appliedRateType: 'LOCAL' | 'FOREIGN' | 'FOREIGN_FALLBACK_TO_LOCAL' = 'LOCAL'

  if (input.customerType === 'FOREIGN') {
    if (input.foreignDailyRate != null && input.foreignDailyRate > 0) {
      effectiveDailyRate = input.foreignDailyRate
      effectiveWeeklyRate = input.foreignWeeklyRate ?? null
      effectiveMonthlyRate = input.foreignMonthlyRate ?? null
      effectiveDeposit = input.foreignSecurityDeposit ?? input.securityDeposit
      appliedRateType = 'FOREIGN'
    } else {
      appliedRateType = 'FOREIGN_FALLBACK_TO_LOCAL'
    }
  }

  return { effectiveDailyRate, effectiveWeeklyRate, effectiveMonthlyRate, effectiveDeposit, appliedRateType }
}

/**
 * Full price calculation for a booking request.
 */
export function calculateBookingPricing(input: PricingInput): PricingResult {
  const pickupDateStr = typeof input.pickupDate === 'string'
    ? input.pickupDate
    : input.pickupDate.toISOString().split('T')[0]
  const returnDateStr = typeof input.returnDate === 'string'
    ? input.returnDate
    : input.returnDate.toISOString().split('T')[0]

  const rentalDays = calculateRentalDays(
    pickupDateStr,
    returnDateStr,
    input.pickupTime,
    input.returnTime,
  )

  const durationHours = calculateDurationHours(
    pickupDateStr,
    returnDateStr,
    input.pickupTime,
    input.returnTime,
  )

  // Resolve effective rates based on customer type
  const { effectiveDailyRate, effectiveWeeklyRate, effectiveMonthlyRate, effectiveDeposit, appliedRateType } = resolveEffectiveRates(input)

  const rentalCharge = calculateRentalCharge(
    rentalDays,
    effectiveDailyRate,
    effectiveWeeklyRate,
    effectiveMonthlyRate
  )

  const deliveryCharge = input.deliveryCharge || 0
  const setupCharge = input.setupCharge || 0
  const discount = input.discount || 0
  const securityDeposit = effectiveDeposit || 0
  const advancePercent = input.advancePercent ?? 30

  const rentalSubtotal = rentalCharge + deliveryCharge + setupCharge - discount
  const totalPayable = Math.max(0, rentalSubtotal)
  const advanceRequired = Math.round(totalPayable * advancePercent / 100)
  const balanceDue = totalPayable - advanceRequired

  // Build breakdown text
  const lines: string[] = []
  if (rentalDays === 1 && durationHours < 24 && durationHours > 0) {
    lines.push(`Rental: ${Math.round(durationHours)} hours (1 day minimum) × Rs. ${effectiveDailyRate.toLocaleString()} = Rs. ${rentalCharge.toLocaleString()}`)
  } else {
    lines.push(`Rental: ${rentalDays} day${rentalDays !== 1 ? 's' : ''} × Rs. ${effectiveDailyRate.toLocaleString()} = Rs. ${rentalCharge.toLocaleString()}`)
  }
  if (deliveryCharge > 0) lines.push(`Delivery: Rs. ${deliveryCharge.toLocaleString()}`)
  if (setupCharge > 0) lines.push(`Setup: Rs. ${setupCharge.toLocaleString()}`)
  if (discount > 0) lines.push(`Discount: -Rs. ${discount.toLocaleString()}`)
  lines.push(`Subtotal: Rs. ${totalPayable.toLocaleString()}`)
  if (securityDeposit > 0) lines.push(`Refundable deposit: Rs. ${securityDeposit.toLocaleString()}`)
  lines.push(`Advance (${advancePercent}%): Rs. ${advanceRequired.toLocaleString()}`)
  lines.push(`Balance due: Rs. ${balanceDue.toLocaleString()}`)

  return {
    rentalDays,
    durationHours,
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
    appliedRateType,
    appliedDailyRate: effectiveDailyRate,
  }
}

/**
 * Validate booking dates and times.
 * Compares full datetime (date + time) to support same-day rentals.
 */
export function validateBookingDates(
  pickupDate: string | Date,
  returnDate: string | Date,
  pickupTime?: string,
  returnTime?: string,
): { valid: boolean; error?: string } {
  const pickupStr = typeof pickupDate === 'string' ? pickupDate : pickupDate.toISOString().split('T')[0]
  const returnStr = typeof returnDate === 'string' ? returnDate : returnDate.toISOString().split('T')[0]

  // Basic date parse check
  const pickupDateOnly = new Date(pickupStr)
  const returnDateOnly = new Date(returnStr)
  if (isNaN(pickupDateOnly.getTime())) return { valid: false, error: 'Invalid pickup date' }
  if (isNaN(returnDateOnly.getTime())) return { valid: false, error: 'Invalid return date' }

  // Pickup date must not be in the past
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (pickupDateOnly < today) return { valid: false, error: 'Pickup date cannot be in the past' }

  // Return date cannot be before pickup date
  if (returnDateOnly < pickupDateOnly) {
    return { valid: false, error: 'Return date/time must be after pickup date/time.' }
  }

  // Full datetime comparison (supports same-day rentals)
  const pickupDT = combineDateAndTime(pickupStr, pickupTime)
  const returnDT = combineDateAndTime(returnStr, returnTime)

  if (returnDT.getTime() <= pickupDT.getTime()) {
    if (pickupStr === returnStr) {
      return { valid: false, error: 'For same-day rentals, return time must be later than pickup time.' }
    }
    return { valid: false, error: 'Return date/time must be after pickup date/time.' }
  }

  // Maximum rental period
  const days = calculateRentalDays(pickupStr, returnStr, pickupTime, returnTime)
  if (days > 365) return { valid: false, error: 'Rental period cannot exceed 365 days' }

  return { valid: true }
}
