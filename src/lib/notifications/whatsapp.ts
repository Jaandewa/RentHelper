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

export async function sendWhatsAppText(
  param1: string | WhatsAppSendParams,
  param2?: string
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
          recipient: targetPhone,
          channel: 'whatsapp',
          status: 'not_configured',
          error: 'WhatsApp integration is disabled',
          sentAt: new Date(),
        },
      }).catch(() => {})
      return { success: false, reason: 'not_configured' }
    }

    if (!config.email || !config.apiKey) {
      await prisma.notificationDelivery.create({
        data: {
          type: 'whatsapp_text',
          recipient: targetPhone,
          channel: 'whatsapp',
          status: 'not_configured',
          error: 'Missing HostGrap email or API key',
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
        recipient: targetPhone,
        channel: 'whatsapp',
        status: isSuccess ? 'sent' : 'failed',
        error: isSuccess ? null : (responseData?.message || responseData?.error || sanitizedResponse || `HTTP ${res.status}`),
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
        recipient: targetPhone,
        channel: 'whatsapp',
        status: 'failed',
        error: errorMsg.slice(0, 500),
        sentAt: new Date(),
      },
    }).catch(() => {})

    return { success: false, error: errorMsg.includes('TimeoutError') ? 'Request timed out (15s)' : 'Request failed' }
  }
}

// ── Message Helpers (construct text + call sendWhatsAppText) ──────────────

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

  const message = `Hello ${customerName},

Your Rental Management System account has been approved.

You can now log in, browse rental items, compare prices, and send booking requests.

Thank you.`

  return sendWhatsAppText(phone, message)
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

  const message = `Hello ${customerName},

Your account verification was not approved.

Reason:
${reason}

Please log in and submit the corrected documents again.

Thank you.`

  return sendWhatsAppText(phone, message)
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
  const message = `New rental request received.

Request: ${details.requestNumber}
Customer: ${details.customerName}
Item: ${details.itemName}
Pickup: ${details.pickupDateTime}
Return: ${details.returnDateTime}
Purpose: ${details.purpose}
Estimated rental total: Rs. ${details.rentalTotal}
Refundable deposit: Rs. ${details.deposit}
Advance required: Rs. ${details.advanceRequired}

Log in to review and accept or reject this request.`;
  return sendWhatsAppText(providerPhone, message);
}

export async function sendBookingAcceptedWhatsApp(customerPhone: string, details: { itemName: string, providerName: string, pickupDateTime: string, returnDateTime: string, advanceRequired: number }) {
  const message = `Your rental request has been accepted!

Item: ${details.itemName}
Provider: ${details.providerName}
Pickup: ${details.pickupDateTime}
Return: ${details.returnDateTime}

Advance payment required: Rs. ${details.advanceRequired}

Please complete the advance payment to confirm your reservation.`;
  return sendWhatsAppText(customerPhone, message);
}

export async function sendBookingRejectedWhatsApp(customerPhone: string, details: { itemName: string, providerName: string, reason: string }) {
  const message = `Your rental request was not approved.

Item: ${details.itemName}
Provider: ${details.providerName}
Reason: ${details.reason}

You can browse other items on the marketplace.`;
  return sendWhatsAppText(customerPhone, message);
}

export async function sendBookingConfirmedWhatsApp(customerPhone: string, details: { itemName: string, providerName: string, pickupDateTime: string, returnDateTime: string, advancePaid: number, balanceDue: number, deposit: number }) {
  const message = `Your rental has been confirmed!

Item: ${details.itemName}
Provider: ${details.providerName}
Pickup: ${details.pickupDateTime}
Return: ${details.returnDateTime}

Advance paid: Rs. ${details.advancePaid}
Remaining balance: Rs. ${details.balanceDue}
Refundable deposit: Rs. ${details.deposit}

Please bring required documents during handover.`;
  return sendWhatsAppText(customerPhone, message);
}

export async function sendBookingConfirmedProviderWhatsApp(providerPhone: string, details: { customerName: string, itemName: string, pickupDateTime: string, returnDateTime: string, advancePaid: number }) {
  const message = `Advance payment received and rental confirmed.

Customer: ${details.customerName}
Item: ${details.itemName}
Pickup: ${details.pickupDateTime}
Return: ${details.returnDateTime}
Advance paid: Rs. ${details.advancePaid}`;
  return sendWhatsAppText(providerPhone, message);
}

export async function sendReviewSubmittedWhatsApp(recipientPhone: string, details: { reviewerName: string, rating: number, itemName: string, bookingNumber: string }) {
  const stars = '⭐'.repeat(details.rating)
  const message = `New review received!

${stars} (${details.rating}/5)
Item: ${details.itemName}
Booking: ${details.bookingNumber}
From: ${details.reviewerName}

Thank you for using RentHelper!`;
  return sendWhatsAppText(recipientPhone, message);
}
