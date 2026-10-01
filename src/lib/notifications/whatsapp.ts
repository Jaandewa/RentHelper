import prisma from '@/lib/prisma'

/**
 * HostGrap WhatsApp API V2 Adapter
 * 
 * Sends text messages via HostGrap's send-message endpoint.
 * Credentials: env vars first (HOSTGRAP_*), DB SiteSettings fallback.
 * All helper functions below construct plain text and call sendWhatsAppText().
 */

/**
 * Formats a phone number for WhatsApp API (E.164 without +).
 * Handles: 0771234567 → 94771234567, +94771234567 → 94771234567, 94771234567 → 94771234567
 */
function formatPhoneForWhatsApp(phone: string, countryCode: string = '+94'): string {
  let cleaned = phone.replace(/[\s\-()]/g, '')
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1)
  const codeDigits = countryCode.replace('+', '')
  if (cleaned.startsWith('0')) cleaned = codeDigits + cleaned.slice(1)
  if (!cleaned.startsWith(codeDigits)) cleaned = codeDigits + cleaned
  return cleaned
}

/**
 * Resolves HostGrap credentials from env vars first, then DB SiteSettings.
 */
export async function getHostGrapConfig(): Promise<{
  enabled: boolean
  email: string | null
  apiKey: string | null
  apiUrl: string
  testPhone: string | null
  countryCode: string
}> {
  // Env vars take priority
  const envEnabled = process.env.HOSTGRAP_WHATSAPP_ENABLED === 'true'
  const envEmail = process.env.HOSTGRAP_EMAIL || null
  const envApiKey = process.env.HOSTGRAP_API_KEY || null
  const envApiUrl = process.env.HOSTGRAP_API_URL || null
  const envTestPhone = process.env.HOSTGRAP_TEST_PHONE || null

  if (envEnabled && envEmail && envApiKey) {
    return {
      enabled: true,
      email: envEmail,
      apiKey: envApiKey,
      apiUrl: envApiUrl || 'https://wa-api.hostgrap.com',
      testPhone: envTestPhone,
      countryCode: '+94',
    }
  }

  // Fallback to DB settings
  const settings = await prisma.siteSettings.findFirst()
  return {
    enabled: settings?.whatsappEnabled ?? false,
    email: settings?.hostgrapEmail || null,
    apiKey: settings?.hostgrapApiKey || null,
    apiUrl: settings?.hostgrapApiUrl || 'https://wa-api.hostgrap.com',
    testPhone: settings?.hostgrapTestPhone || null,
    countryCode: settings?.whatsappCountryCode || '+94',
  }
}

export interface WhatsAppSendParams {
  phoneNumber?: string
  phone?: string
  message: string
}

export interface KycApprovedParams {
  phoneNumber?: string
  phone?: string
  customerName?: string
  name?: string
}

export interface KycRejectedParams {
  phoneNumber?: string
  phone?: string
  customerName?: string
  name?: string
  reason: string
}

/** Optional event context for delivery log enrichment */
export interface WhatsAppEventContext {
  eventType?: string
  recipientUserId?: string
  relatedEntityId?: string
  metadata?: any
}

export async function sendWhatsAppText(
  param1: string | WhatsAppSendParams,
  param2?: string,
  eventContext?: WhatsAppEventContext
) {
  let targetPhone = ''
  let targetMessage = ''

  if (typeof param1 === 'string') {
    targetPhone = param1
    targetMessage = param2 || ''
  } else {
    targetPhone = param1.phoneNumber || param1.phone || ''
    targetMessage = param1.message
  }

  if (!targetPhone) {
    return { success: false, reason: 'missing_phone' }
  }

  try {
    const config = await getHostGrapConfig()

    // Format phone number
    targetPhone = formatPhoneForWhatsApp(targetPhone, config.countryCode)

    if (!config.enabled) {
      await prisma.notificationDelivery.create({
        data: {
          type: 'whatsapp_text',
          eventType: eventContext?.eventType || undefined,
          recipient: targetPhone,
          recipientUserId: eventContext?.recipientUserId || undefined,
          relatedEntityId: eventContext?.relatedEntityId || undefined,
          channel: 'whatsapp',
          status: 'not_configured',
          error: 'WhatsApp integration is disabled',
          metadata: eventContext?.metadata || undefined,
          sentAt: new Date(),
        },
      }).catch(() => {})
      return { success: false, reason: 'not_configured' }
    }

    if (!config.email || !config.apiKey) {
      await prisma.notificationDelivery.create({
        data: {
          type: 'whatsapp_text',
          eventType: eventContext?.eventType || undefined,
          recipient: targetPhone,
          recipientUserId: eventContext?.recipientUserId || undefined,
          relatedEntityId: eventContext?.relatedEntityId || undefined,
          channel: 'whatsapp',
          status: 'not_configured',
          error: 'Missing HostGrap email or API key',
          metadata: eventContext?.metadata || undefined,
          sentAt: new Date(),
        },
      }).catch(() => {})
      return { success: false, reason: 'not_configured' }
    }

    // Build HostGrap API request (application/x-www-form-urlencoded)
    const url = `${config.apiUrl}/api/send-message.php`
    const body = new URLSearchParams({
      email: config.email,
      api_key: config.apiKey,
      phone: targetPhone,
      message: targetMessage,
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(15000),
    })

    // Parse response — HostGrap may return JSON or plain text
    let responseData: any = null
    let responseText = ''
    try {
      responseText = await res.text()
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { raw: responseText }
    }

    const isSuccess = res.ok && (responseData?.status === 'success' || responseData?.status === true || res.status === 200)

    // Sanitize response for logging — never store API key
    const sanitizedResponse = responseData ? JSON.stringify(responseData).slice(0, 500) : null

    await prisma.notificationDelivery.create({
      data: {
        type: 'whatsapp_text',
        eventType: eventContext?.eventType || undefined,
        recipient: targetPhone,
        recipientUserId: eventContext?.recipientUserId || undefined,
        relatedEntityId: eventContext?.relatedEntityId || undefined,
        channel: 'whatsapp',
        status: isSuccess ? 'sent' : 'failed',
        error: isSuccess ? null : (responseData?.message || responseData?.error || sanitizedResponse || `HTTP ${res.status}`),
        metadata: eventContext?.metadata || undefined,
        sentAt: new Date(),
      },
    }).catch(() => {})

    return {
      success: isSuccess,
      providerMessageId: responseData?.message_id || responseData?.id || undefined,
      providerResponse: responseData,
      ...(isSuccess ? {} : { error: responseData?.message || responseData?.error || `HTTP ${res.status}` }),
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)

    await prisma.notificationDelivery.create({
      data: {
        type: 'whatsapp_text',
        eventType: eventContext?.eventType || undefined,
        recipient: targetPhone,
        recipientUserId: eventContext?.recipientUserId || undefined,
        relatedEntityId: eventContext?.relatedEntityId || undefined,
        channel: 'whatsapp',
        status: 'failed',
        error: errorMsg.slice(0, 500),
        metadata: eventContext?.metadata || undefined,
        sentAt: new Date(),
      },
    }).catch(() => {})

    return { success: false, error: errorMsg.includes('TimeoutError') ? 'Request timed out (15s)' : 'Request failed' }
  }
}

// ── Message Helpers (use template renderer + call sendWhatsAppText) ──────

import { renderWhatsAppTemplate } from './template-renderer'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rent.healingcity.lk'
const SUPPORT_CONTACT = process.env.SUPPORT_CONTACT || '+94 77 123 4567'

export async function sendKycApprovedWhatsApp(
  param1: string | KycApprovedParams,
  param2?: string
) {
  let phone = ''
  let customerName = ''

  if (typeof param1 === 'string') {
    phone = param1
    customerName = param2 || 'Customer'
  } else {
    phone = param1.phoneNumber || param1.phone || ''
    customerName = param1.customerName || param1.name || 'Customer'
  }

  const result = await renderWhatsAppTemplate('KYC_APPROVED', {
    customerName,
    appName: 'RentHelper',
    loginUrl: `${BASE_URL}/auth/signin`,
    supportContact: SUPPORT_CONTACT,
  })

  if (result.skipped) return { success: true, skipped: true }
  return sendWhatsAppText(phone, result.message, { eventType: 'KYC_APPROVED' })
}

export async function sendKycRejectedWhatsApp(
  param1: string | KycRejectedParams,
  param2?: string,
  param3?: string
) {
  let phone = ''
  let customerName = ''
  let reason = ''

  if (typeof param1 === 'string') {
    phone = param1
    customerName = param2 || 'Customer'
    reason = param3 || 'Verification document invalid'
  } else {
    phone = param1.phoneNumber || param1.phone || ''
    customerName = param1.customerName || param1.name || 'Customer'
    reason = param1.reason || 'Verification document invalid'
  }

  const result = await renderWhatsAppTemplate('KYC_REJECTED', {
    customerName,
    rejectionReason: reason,
    appName: 'RentHelper',
    supportContact: SUPPORT_CONTACT,
  })

  if (result.skipped) return { success: true, skipped: true }
  return sendWhatsAppText(phone, result.message, { eventType: 'KYC_REJECTED' })
}

export async function sendTestWhatsAppMessage(
  param1: string | WhatsAppSendParams,
  param2?: string
) {
  return sendWhatsAppText(param1 as any, param2)
}

export async function sendTestWhatsApp(phone: string, message: string) {
  return sendWhatsAppText(phone, message)
}

export async function sendBookingRequestWhatsApp(providerPhone: string, details: { requestNumber: string, customerName: string, itemName: string, pickupDateTime: string, returnDateTime: string, purpose: string, rentalTotal: number, deposit: number, advanceRequired: number }) {
  const result = await renderWhatsAppTemplate('NEW_BOOKING_REQUEST', {
    providerName: 'Provider',
    customerName: details.customerName,
    bookingId: details.requestNumber,
    itemName: details.itemName,
    pickupDateTime: details.pickupDateTime,
    returnDateTime: details.returnDateTime,
    rentalTotal: String(details.rentalTotal),
    advanceRequired: String(details.advanceRequired),
    customerPurpose: details.purpose,
    providerDashboardUrl: `${BASE_URL}/dashboard/bookings`,
    supportContact: SUPPORT_CONTACT,
  })

  if (result.skipped) return { success: true, skipped: true }
  return sendWhatsAppText(providerPhone, result.message, { eventType: 'NEW_BOOKING_REQUEST' })
}

export async function sendBookingAcceptedWhatsApp(customerPhone: string, details: { itemName: string, providerName: string, pickupDateTime: string, returnDateTime: string, advanceRequired: number, paymentDeadline?: string, bookingId?: string }) {
  const result = await renderWhatsAppTemplate('BOOKING_ACCEPTED', {
    customerName: 'Customer',
    bookingId: details.bookingId,
    itemName: details.itemName,
    providerName: details.providerName,
    pickupDateTime: details.pickupDateTime,
    returnDateTime: details.returnDateTime,
    advanceRequired: String(details.advanceRequired),
    paymentDeadline: details.paymentDeadline,
    paymentUrl: `${BASE_URL}/customer/bookings`,
    supportContact: SUPPORT_CONTACT,
  })

  if (result.skipped) return { success: true, skipped: true }
  return sendWhatsAppText(customerPhone, result.message, { eventType: 'BOOKING_ACCEPTED' })
}

export async function sendBookingRejectedWhatsApp(customerPhone: string, details: { itemName: string, providerName: string, reason: string, bookingId?: string }) {
  const result = await renderWhatsAppTemplate('BOOKING_REJECTED', {
    customerName: 'Customer',
    bookingId: details.bookingId,
    itemName: details.itemName,
    providerName: details.providerName,
    rejectionReason: details.reason,
    marketplaceUrl: `${BASE_URL}/marketplace`,
    supportContact: SUPPORT_CONTACT,
  })

  if (result.skipped) return { success: true, skipped: true }
  return sendWhatsAppText(customerPhone, result.message, { eventType: 'BOOKING_REJECTED' })
}

export async function sendBookingConfirmedWhatsApp(customerPhone: string, details: { itemName: string, providerName: string, pickupDateTime: string, returnDateTime: string, advancePaid: number, balanceDue: number, deposit: number, bookingId?: string }) {
  const result = await renderWhatsAppTemplate('PAYMENT_CONFIRMED', {
    customerName: 'Customer',
    bookingId: details.bookingId,
    itemName: details.itemName,
    providerName: details.providerName,
    amountPaid: String(details.advancePaid),
    paymentDate: new Date().toLocaleDateString('en-LK'),
    advancePaid: String(details.advancePaid),
    remainingBalance: String(details.balanceDue),
    securityDeposit: String(details.deposit),
    bookingStatus: 'Confirmed',
    bookingDetailsUrl: `${BASE_URL}/customer/bookings`,
    supportContact: SUPPORT_CONTACT,
  })

  if (result.skipped) return { success: true, skipped: true }
  return sendWhatsAppText(customerPhone, result.message, { eventType: 'PAYMENT_CONFIRMED' })
}

export async function sendBookingConfirmedProviderWhatsApp(providerPhone: string, details: { customerName: string, itemName: string, pickupDateTime: string, returnDateTime: string, advancePaid: number, bookingId?: string }) {
  const result = await renderWhatsAppTemplate('BOOKING_CONFIRMED_PROVIDER', {
    providerName: 'Provider',
    bookingId: details.bookingId,
    customerName: details.customerName,
    itemName: details.itemName,
    pickupDateTime: details.pickupDateTime,
    returnDateTime: details.returnDateTime,
    amountPaid: String(details.advancePaid),
    advancePaid: String(details.advancePaid),
    providerBookingUrl: `${BASE_URL}/dashboard/bookings`,
    supportContact: SUPPORT_CONTACT,
  })

  if (result.skipped) return { success: true, skipped: true }
  return sendWhatsAppText(providerPhone, result.message, { eventType: 'BOOKING_CONFIRMED_PROVIDER' })
}

export async function sendReviewSubmittedWhatsApp(recipientPhone: string, details: { reviewerName: string, rating: number, itemName: string, bookingNumber: string, recipientName?: string }) {
  const result = await renderWhatsAppTemplate('REVIEW_SUBMITTED', {
    recipientName: details.recipientName || 'User',
    reviewerName: details.reviewerName,
    bookingId: details.bookingNumber,
    itemName: details.itemName,
    rating: String(details.rating),
    reviewText: '',
    profileUrl: `${BASE_URL}`,
    supportContact: SUPPORT_CONTACT,
  })

  if (result.skipped) return { success: true, skipped: true }
  return sendWhatsAppText(recipientPhone, result.message, { eventType: 'REVIEW_SUBMITTED' })
}

export async function sendRegistrationOtpWhatsApp(phone: string, details: { customerName: string, otpCode: string, expiryMinutes?: number }) {
  const result = await renderWhatsAppTemplate('REGISTRATION_OTP', {
    customerName: details.customerName,
    otpCode: details.otpCode,
    expiryMinutes: String(details.expiryMinutes || 10),
    appName: 'RentHelper',
    supportContact: SUPPORT_CONTACT,
  })

  if (result.skipped) return { success: true, skipped: true }
  return sendWhatsAppText(phone, result.message, { eventType: 'REGISTRATION_OTP' })
}

export async function sendItemHandedOverWhatsApp(customerPhone: string, details: { customerName: string, itemName: string, providerName: string, pickupDateTime: string, returnDateTime: string, bookingId?: string }) {
  const result = await renderWhatsAppTemplate('ITEM_HANDED_OVER', {
    customerName: details.customerName,
    bookingId: details.bookingId,
    itemName: details.itemName,
    providerName: details.providerName,
    pickupDateTime: details.pickupDateTime,
    returnDateTime: details.returnDateTime,
    supportContact: SUPPORT_CONTACT,
  })

  if (result.skipped) return { success: true, skipped: true }
  return sendWhatsAppText(customerPhone, result.message, { eventType: 'ITEM_HANDED_OVER' })
}
