import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.siteSettings.findFirst();

    if (!settings) {
      return NextResponse.json({});
    }

    let maskedToken = settings.whatsappAccessToken;
    if (maskedToken && maskedToken.length > 4) {
      maskedToken = '****' + maskedToken.slice(-4);
    }

    return NextResponse.json({
      whatsappEnabled: settings.whatsappEnabled,
      whatsappProvider: settings.whatsappProvider,
      whatsappBaseUrl: settings.whatsappBaseUrl,
      whatsappPhoneNumberId: settings.whatsappPhoneNumberId,
      whatsappBusinessId: settings.whatsappBusinessId,
      whatsappWebhookToken: settings.whatsappWebhookToken,
      whatsappCountryCode: settings.whatsappCountryCode,
      whatsappAccessToken: maskedToken,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const currentSettings = await prisma.siteSettings.findFirst();

    let newAccessToken = body.whatsappAccessToken;
    if (newAccessToken && newAccessToken.startsWith('****')) {
      newAccessToken = currentSettings?.whatsappAccessToken;
    }

    const data = {
      whatsappEnabled: body.whatsappEnabled,
      whatsappProvider: body.whatsappProvider,
      whatsappBaseUrl: body.whatsappBaseUrl,
      whatsappPhoneNumberId: body.whatsappPhoneNumberId,
      whatsappBusinessId: body.whatsappBusinessId,
      whatsappWebhookToken: body.whatsappWebhookToken,
      whatsappCountryCode: body.whatsappCountryCode,
      whatsappAccessToken: newAccessToken,
    };

    const updated = currentSettings
      ? await prisma.siteSettings.update({ where: { id: currentSettings.id }, data })
      : await prisma.siteSettings.create({ data });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
