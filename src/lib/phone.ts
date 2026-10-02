/**
 * International Phone Normalization
 * 
 * Uses libphonenumber-js for robust international phone parsing.
 * Canonical storage format: digits-only E.164 without leading +
 * Examples: 94771234567, 447911123456, 919876543210
 */

import { parsePhoneNumberFromString } from 'libphonenumber-js'

/**
 * Normalize any phone number to E.164 digits-only format.
 * Defaults to Sri Lanka (LK) country code if no country code is provided.
 * Returns null if the number cannot be parsed as a valid phone number.
 */
export function normalizePhoneInternational(phone: string, defaultCountry: string = 'LK'): string | null {
  if (!phone || typeof phone !== 'string') return null
  
  const cleaned = phone.trim()
  if (!cleaned) return null
  
  try {
    const parsed = parsePhoneNumberFromString(cleaned, defaultCountry as any)
    if (!parsed || !parsed.isValid()) return null
    
    // E.164 format is +94771234567, we strip the +
    const e164 = parsed.format('E.164') // e.g. "+94771234567"
    return e164.replace('+', '') // e.g. "94771234567"
  } catch {
    return null
  }
}

/**
 * Mask a phone number for display.
 * Shows country code + first 2 digits + masked middle + last 3 digits.
 * e.g. "94771234567" → "+94 71- - - - - 567"
 */
export function maskPhoneForDisplay(normalizedPhone: string): string {
  if (!normalizedPhone || normalizedPhone.length < 8) return '***'
  
  // Format: +CC XX- - - - - XXX
  const countryPart = normalizedPhone.slice(0, 2)
  const firstDigits = normalizedPhone.slice(2, 4)
  const lastDigits = normalizedPhone.slice(-3)
  const maskedMiddle = normalizedPhone.slice(4, -3).replace(/./g, '-')
  
  return `+${countryPart} ${firstDigits}${maskedMiddle}${lastDigits}`
}

/**
 * Mask an email for display.
 * e.g. "developer@gmail.com" → "d- - - - - - - - @gmail.com"
 */
export function maskEmailForDisplay(email: string): string {
  if (!email || !email.includes('@')) return '***'
  
  const [local, domain] = email.split('@')
  if (local.length <= 1) return `${local}@${domain}`
  
  const firstChar = local[0]
  const masked = local.slice(1).replace(/./g, '-')
  return `${firstChar}${masked}@${domain}`
}

/**
 * Normalize an identity number (NIC or Passport).
 * - Trim whitespace
 * - Uppercase letters
 * - Remove internal spaces
 */
export function normalizeIdentityNumber(value: string): string {
  if (!value || typeof value !== 'string') return ''
  return value.trim().toUpperCase().replace(/\s+/g, '')
}

/**
 * Detect the type of identifier input for password recovery.
 * Returns: 'email' | 'phone' | 'nic' | 'passport' | 'unknown'
 */
export function detectIdentifierType(input: string): 'email' | 'phone' | 'nic' | 'passport' | 'unknown' {
  const trimmed = input.trim()
  if (!trimmed) return 'unknown'
  
  // Email: contains @
  if (trimmed.includes('@')) return 'email'
  
  // Phone: starts with + or 0, mostly digits
  const digitRatio = (trimmed.replace(/[^\d]/g, '').length) / trimmed.length
  if ((trimmed.startsWith('+') || trimmed.startsWith('0')) && digitRatio > 0.8) return 'phone'
  
  // Sri Lankan NIC: old format (9 digits + V/X) or new format (12 digits)
  const cleaned = trimmed.replace(/\s+/g, '').toUpperCase()
  if (/^\d{9}[VX]$/i.test(cleaned) || /^\d{12}$/.test(cleaned)) return 'nic'
  
  // If mostly digits (7+), likely a phone
  if (/^\d{7,}$/.test(cleaned)) return 'phone'
  
  // Passport: letter(s) followed by digits, typically 6-9 chars
  if (/^[A-Z]\d{6,8}$/i.test(cleaned)) return 'passport'
  
  // If alphanumeric 6-15 chars, could be passport
  if (/^[A-Z0-9]{6,15}$/i.test(cleaned)) return 'passport'
  
  return 'unknown'
}
