/**
 * OTP Utilities
 * 
 * Centralized OTP generation, hashing, verification token signing,
 * and Sri Lankan phone number normalization.
 * 
 * Security: OTP is never stored in plaintext — only bcrypt hash.
 * Verification tokens use HMAC-SHA256 with NEXTAUTH_SECRET.
 */

import { randomInt, randomBytes, createHmac } from 'crypto'
import bcrypt from 'bcryptjs'

// ── Phone Normalization ──────────────────────────────────────────────────

/**
 * Normalizes a Sri Lankan phone number to international format without '+'.
 * 
 * 0771234567   → 94771234567
 * +94771234567 → 94771234567
 * 94771234567  → 94771234567
 * 
 * Strips spaces, hyphens, brackets, and other formatting characters.
 * Returns null if the result is not a valid Sri Lankan number.
 */
export function normalizeSriLankanPhone(phone: string): string | null {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // Remove leading +
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1)
  
  // Convert leading 0 to 94
  if (cleaned.startsWith('0')) cleaned = '94' + cleaned.slice(1)
  
  // If doesn't start with 94, prepend it
  if (!cleaned.startsWith('94')) cleaned = '94' + cleaned
  
  // Validate: must be 94 followed by exactly 9 digits
  if (!/^94\d{9}$/.test(cleaned)) return null
  
  return cleaned
}

/**
 * Masks a normalized phone number for display.
 * 94716616767 → "9471••••••67"
 */
export function maskPhone(normalized: string): string {
  if (normalized.length < 6) return '••••••'
  const prefix = normalized.slice(0, 4)
  const suffix = normalized.slice(-2)
  const masked = '•'.repeat(normalized.length - 6)
  return `${prefix}${masked}${suffix}`
}

// ── OTP Generation & Hashing ─────────────────────────────────────────────

/**
 * Generates a cryptographically secure 6-digit OTP.
 * Uses crypto.randomInt for uniform distribution.
 */
export function generateOtp(): string {
  return String(randomInt(100000, 999999))
}

/**
 * Hashes an OTP for secure database storage.
 * Uses bcrypt with cost factor 10.
 */
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10)
}

/**
 * Verifies an OTP against its bcrypt hash.
 */
export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash)
}

// ── Session Token ────────────────────────────────────────────────────────

/**
 * Generates a cryptographically random session token for browser binding.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

// ── Registration Verification Token ──────────────────────────────────────

const TOKEN_EXPIRY_MINUTES = 15

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is not configured')
  return secret
}

/**
 * Signs a registration verification token.
 * Token is HMAC-SHA256 signed and contains:
 * - normalized phone number
 * - purpose (registration)
 * - challenge ID
 * - expiry timestamp
 */
export function signVerificationToken(
  phone: string,
  challengeId: string,
  purpose: string = 'REGISTRATION_WHATSAPP'
): { token: string; expiresAt: Date } {
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000)
  
  const payload = {
    phone,
    purpose,
    challengeId,
    exp: expiresAt.getTime(),
  }
  
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', getSecret())
    .update(payloadStr)
    .digest('base64url')
  
  const token = `${payloadStr}.${signature}`
  
  return { token, expiresAt }
}

/**
 * Verifies a registration verification token.
 * Returns the payload if valid, null if invalid/expired/tampered.
 */
export function verifyVerificationToken(
  token: string,
  allowedPurposes: string[] = ['REGISTRATION_WHATSAPP']
): { phone: string; purpose: string; challengeId: string; exp: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null
    
    const [payloadStr, signature] = parts
    
    // Verify signature
    const expectedSig = createHmac('sha256', getSecret())
      .update(payloadStr)
      .digest('base64url')
    
    if (signature !== expectedSig) return null
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString())
    
    // Check expiry
    if (Date.now() > payload.exp) return null
    
    // Check purpose
    if (!allowedPurposes.includes(payload.purpose)) return null
    
    return payload
  } catch {
    return null
  }
}

// ── Validation ───────────────────────────────────────────────────────────

/**
 * Validates that a string is exactly 6 digits.
 */
export function isValidOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp)
}

/**
 * Validates Sri Lankan phone number format (raw input).
 * Accepts: 07XXXXXXXX, +947XXXXXXXX, 947XXXXXXXX
 */
export function isValidSriLankanPhoneInput(phone: string): boolean {
  const cleaned = phone.replace(/[^\d+]/g, '')
  return /^(\+?94|0)\d{9}$/.test(cleaned)
}
