import prisma from '@/lib/prisma';

export async function sendWhatsAppText(phone: string, message: string) {
  try {
    const settings = await prisma.siteSettings.findFirst();

    if (!settings?.whatsappEnabled) {
      return { success: false, reason: 'not_configured' };
    }

    const baseUrl = settings.whatsappBaseUrl || 'https://graph.facebook.com/v17.0';
    const phoneNumberId = settings.whatsappPhoneNumberId;
    const accessToken = settings.whatsappAccessToken;

    if (!phoneNumberId || !accessToken) {
      return { success: false, reason: 'not_configured' };
    }

    const url = `${baseUrl}/${phoneNumberId}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    
    await prisma.notificationDelivery.create({
      data: {
        type: 'whatsapp_text',
        recipient: phone,
        channel: 'whatsapp',
        status: res.ok ? 'success' : 'failed',
        error: res.ok ? null : JSON.stringify(data),
        sentAt: new Date(),
      },
    });

    return { success: res.ok, data };
  } catch (error) {
    await prisma.notificationDelivery.create({
      data: {
        type: 'whatsapp_text',
        recipient: phone,
        channel: 'whatsapp',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        sentAt: new Date(),
      },
    }).catch(console.error);
    
    return { success: false, error: 'Request failed' };
  }
}

export async function sendKycApprovedWhatsApp(phone: string, name: string) {
  const message = `Hello ${name}, your KYC has been approved.`;
  return sendWhatsAppText(phone, message);
}

export async function sendKycRejectedWhatsApp(phone: string, name: string, reason: string) {
  const message = `Hello ${name}, your KYC was rejected. Reason: ${reason}.`;
  return sendWhatsAppText(phone, message);
}

export async function sendTestWhatsApp(phone: string, message: string) {
  return sendWhatsAppText(phone, message);
}
