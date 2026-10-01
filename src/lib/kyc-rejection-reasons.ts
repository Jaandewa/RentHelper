/**
 * KYC Rejection Reason Codes
 * 
 * Server-side allow-list of standardized rejection reasons.
 * Used by both the Admin UI dropdown and API validation.
 */

export interface KycRejectionReason {
  code: string
  label: string        // Admin dropdown label
  customerMessage: string  // Customer-facing message
}

export const KYC_REJECTION_REASONS: KycRejectionReason[] = [
  {
    code: 'ID_FRONT_UNCLEAR',
    label: 'Front side of ID image is unclear',
    customerMessage: 'Front side of ID image is unclear',
  },
  {
    code: 'ID_BACK_UNCLEAR',
    label: 'Back side of ID image is unclear',
    customerMessage: 'Back side of ID image is unclear',
  },
  {
    code: 'ID_NUMBER_MISMATCH',
    label: 'ID number does not match submitted details',
    customerMessage: 'ID number does not match submitted details',
  },
  {
    code: 'SELFIE_UNCLEAR',
    label: 'Selfie image is unclear',
    customerMessage: 'Selfie image is unclear',
  },
  {
    code: 'SELFIE_ID_MISMATCH',
    label: 'Selfie does not match ID photo',
    customerMessage: 'Selfie does not match ID photo',
  },
  {
    code: 'ID_EXPIRED',
    label: 'ID document has expired',
    customerMessage: 'ID document has expired',
  },
  {
    code: 'ID_INCOMPLETE_OR_CROPPED',
    label: 'ID document is incomplete, cropped, or not fully visible',
    customerMessage: 'ID document is incomplete, cropped, or not fully visible',
  },
  {
    code: 'NAME_MISMATCH',
    label: 'Full name does not match the ID document',
    customerMessage: 'Full name does not match the ID document',
  },
  {
    code: 'DOCUMENT_NOT_VALID',
    label: 'Submitted document is not a valid supported identity document',
    customerMessage: 'Submitted document is not a valid supported identity document',
  },
  {
    code: 'OTHER',
    label: 'Other reason',
    customerMessage: 'Other reason',
  },
]

/** Valid reason codes for server-side validation */
export const VALID_REASON_CODES = KYC_REJECTION_REASONS.map(r => r.code)

/** Look up a reason by code */
export function getReasonByCode(code: string): KycRejectionReason | undefined {
  return KYC_REJECTION_REASONS.find(r => r.code === code)
}

/**
 * Build the final customer-facing rejection reason text.
 * Combines the standardized message with an optional admin note.
 */
export function buildFinalReason(code: string, additionalNote?: string): string {
  const reason = getReasonByCode(code)
  if (!reason) return additionalNote?.trim() || 'Documents not valid'
  
  const base = reason.customerMessage
  const note = additionalNote?.trim()
  
  if (note) {
    return `${base}. ${note}`
  }
  return base
}
