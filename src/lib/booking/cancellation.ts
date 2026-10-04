import { combineDateAndTime } from './pricing'

export type CancellationActor = 'CUSTOMER' | 'PROVIDER'

export type CancellationPolicyResult = {
  refundPercentage: number // 100, 50, or 0
  reasonCode: string
  hoursUntilPickup: number
  policyLabel: string
}

export type EligiblePaymentForRefund = {
  id: string
  amount: number
  type: string
  calculatedRefundAmount: number
}

export type RefundCalculationSummary = {
  policy: CancellationPolicyResult
  totalRentalPaid: number
  totalRefundCalculated: number
  retainedAmount: number
  depositPrepaid: boolean
  depositAmount: number
  eligiblePayments: EligiblePaymentForRefund[]
}

/**
 * Calculate pickup Date from booking pickupDate and optional pickupTime.
 * Standardized to local time / Asia/Colombo context.
 */
export function getBookingPickupDateTime(pickupDate: Date | string, pickupTime?: string | null): Date {
  const dateStr = typeof pickupDate === 'string'
    ? pickupDate.split('T')[0]
    : pickupDate.toISOString().split('T')[0]
  return combineDateAndTime(dateStr, pickupTime || undefined)
}

/**
 * Evaluate platform default cancellation policy based on actor and pickup datetime.
 */
export function evaluateCancellationPolicy(
  actor: CancellationActor,
  pickupDate: Date | string,
  pickupTime?: string | null,
  now: Date = new Date()
): CancellationPolicyResult {
  const pickupDateTime = getBookingPickupDateTime(pickupDate, pickupTime)
  const diffMs = pickupDateTime.getTime() - now.getTime()
  const hoursUntilPickup = Math.max(0, diffMs / (1000 * 60 * 60))

  if (actor === 'PROVIDER') {
    return {
      refundPercentage: 100,
      reasonCode: 'PROVIDER_CANCELLATION',
      hoursUntilPickup,
      policyLabel: 'Provider Cancellation — 100% Refund of Rental Payments',
    }
  }

  // Customer cancellation policy logic
  if (hoursUntilPickup > 48) {
    return {
      refundPercentage: 100,
      reasonCode: 'CUSTOMER_CANCEL_POLICY_100',
      hoursUntilPickup,
      policyLabel: 'Customer Cancellation (>48h notice) — 100% Refund',
    }
  } else if (hoursUntilPickup >= 24) {
    return {
      refundPercentage: 50,
      reasonCode: 'CUSTOMER_CANCEL_POLICY_50',
      hoursUntilPickup,
      policyLabel: 'Customer Cancellation (24h-48h notice) — 50% Refund',
    }
  } else {
    return {
      refundPercentage: 0,
      reasonCode: 'CUSTOMER_CANCEL_POLICY_0',
      hoursUntilPickup,
      policyLabel: 'Customer Cancellation (<24h notice) — Non-refundable (0% Refund)',
    }
  }
}

/**
 * Calculate refunds for successful rental payments (advance and balance only).
 * Uses Math.round() for whole LKR rupees.
 */
export function calculateRefundSummary(
  actor: CancellationActor,
  booking: {
    pickupDate: Date | string
    pickupTime?: string | null
    payments: Array<{
      id: string
      amount: number
      type: string
    }>
  },
  now: Date = new Date()
): RefundCalculationSummary {
  const policy = evaluateCancellationPolicy(actor, booking.pickupDate, booking.pickupTime, now)

  let totalRentalPaid = 0
  let totalRefundCalculated = 0
  let depositPrepaid = false
  let depositAmount = 0

  const eligiblePayments: EligiblePaymentForRefund[] = []

  for (const payment of booking.payments) {
    if (payment.type === 'deposit') {
      depositPrepaid = true
      depositAmount += payment.amount
      continue
    }

    if (payment.type === 'advance' || payment.type === 'balance') {
      totalRentalPaid += payment.amount

      let refundForPayment = 0
      if (policy.refundPercentage === 100) {
        refundForPayment = payment.amount
      } else if (policy.refundPercentage === 50) {
        refundForPayment = Math.round(payment.amount * 0.5)
      } else {
        refundForPayment = 0
      }

      totalRefundCalculated += refundForPayment

      eligiblePayments.push({
        id: payment.id,
        amount: payment.amount,
        type: payment.type,
        calculatedRefundAmount: refundForPayment,
      })
    }
  }

  const retainedAmount = Math.max(0, totalRentalPaid - totalRefundCalculated)

  return {
    policy,
    totalRentalPaid,
    totalRefundCalculated,
    retainedAmount,
    depositPrepaid,
    depositAmount,
    eligiblePayments,
  }
}
