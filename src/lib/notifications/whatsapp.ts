import prisma from '@/lib/prisma'

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
    const settings = await prisma.siteSettings.findFirst()

    if (!settings?.whatsappEnabled) {
      // Log as not configured
      await prisma.notificationDelivery.create({
        data: {
          type: 'whatsapp_text',
          recipient: targetPhone,
          channel: 'whatsapp',
          status: 'not_configured',
          error: 'WhatsApp integration is disabled in settings',
          sentAt: new Date(),
        },
      }).catch(() => {})
      return { success: false, reason: 'not_configured' }
    }

    const baseUrl = settings.whatsappBaseUrl || 'https://graph.facebook.com/v17.0'
    const phoneNumberId = settings.whatsappPhoneNumberId
    const accessToken = settings.whatsappAccessToken

    if (!phoneNumberId || !accessToken) {
      await prisma.notificationDelivery.create({
        data: {
          type: 'whatsapp_text',
          recipient: targetPhone,
          channel: 'whatsapp',
          status: 'not_configured',
          error: 'Missing Phone Number ID or Access Token',
          sentAt: new Date(),
        },
      }).catch(() => {})
      return { success: false, reason: 'not_configured' }
    }

    const url = `${baseUrl}/${phoneNumberId}/messages`
    const body = {
      messaging_product: 'whatsapp',
      to: targetPhone,
      type: 'text',
      text: { body: targetMessage },
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    await prisma.notificationDelivery.create({
      data: {
        type: 'whatsapp_text',
        recipient: targetPhone,
        channel: 'whatsapp',
        status: res.ok ? 'sent' : 'failed',
        error: res.ok ? null : JSON.stringify(data),
        sentAt: new Date(),
      },
    }).catch(() => {})

    return { success: res.ok, data }
  } catch (error) {
    await prisma.notificationDelivery.create({
      data: {
        type: 'whatsapp_text',
        recipient: targetPhone,
        channel: 'whatsapp',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        sentAt: new Date(),
      },
    }).catch(() => {})

    return { success: false, error: 'Request failed' }
  }
}

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
