/**
 * Deposit Deduction Reason Codes
 * 
 * Server-side allow-list for security deposit deduction reasons.
 */

export interface DepositDeductionReason {
  code: string
  label: string           // Provider-facing label
  customerMessage: string // Customer-facing message
}

export const DEPOSIT_DEDUCTION_REASONS: DepositDeductionReason[] = [
  {
    code: 'NO_DEDUCTION',
    label: 'No deduction',
    customerMessage: 'No deduction',
  },
  {
    code: 'ITEM_DAMAGE',
    label: 'Item damage',
    customerMessage: 'Item damage',
  },
  {
    code: 'MISSING_ITEM_OR_ACCESSORY',
    label: 'Missing item or accessory',
    customerMessage: 'Missing item or accessory',
  },
  {
    code: 'LATE_RETURN_FEE',
    label: 'Late return fee',
    customerMessage: 'Late return fee',
  },
  {
    code: 'EXCESS_CLEANING',
    label: 'Excess cleaning required',
    customerMessage: 'Excess cleaning required',
  },
  {
    code: 'UNPAID_RENTAL_BALANCE',
    label: 'Unpaid rental balance',
    customerMessage: 'Unpaid rental balance',
  },
  {
    code: 'OTHER',
    label: 'Other reason',
    customerMessage: 'Other reason',
  },
]

export const VALID_DEDUCTION_CODES = DEPOSIT_DEDUCTION_REASONS.map(r => r.code)

export function getDeductionByCode(code: string): DepositDeductionReason | undefined {
  return DEPOSIT_DEDUCTION_REASONS.find(r => r.code === code)
}

export function buildDeductionReasonText(code: string, additionalNote?: string): string {
  const reason = getDeductionByCode(code)
  if (!reason) return additionalNote?.trim() || 'Deduction applied'
  
  const base = reason.customerMessage
  const note = additionalNote?.trim()
  
  return note ? `${base}. ${note}` : base
}

/** Handover condition options */
export const HANDOVER_CONDITIONS = [
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'EXISTING_DAMAGE', label: 'Existing damage / issue recorded' },
]

/** Return condition options */
export const RETURN_CONDITIONS = [
  { value: 'NO_NEW_DAMAGE', label: 'No new damage — item returned in acceptable condition' },
  { value: 'DAMAGED', label: 'New damage found' },
  { value: 'MISSING_ITEMS', label: 'Item/accessory missing' },
  { value: 'LATE_RETURN', label: 'Late return' },
  { value: 'NEEDS_REVIEW', label: 'Requires further review' },
  { value: 'OTHER', label: 'Other' },
]

/** Settlement method options */
export const SETTLEMENT_METHODS = [
  { value: 'MANUAL_BANK_TRANSFER', label: 'Manual bank transfer' },
  { value: 'CASH', label: 'Cash' },
  { value: 'NONE', label: 'No refund required' },
]
