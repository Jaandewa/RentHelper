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
      return NextResponse.json({
        whatsappEnabled: false,
        hostgrapEmail: null,
        hostgrapApiKey: null,
        hostgrapApiUrl: 'https://wa-api.hostgrap.com',
        hostgrapTestPhone: null,
        whatsappCountryCode: '+94',
      });
    }

    let maskedApiKey: string | null = null;
    if (settings.hostgrapApiKey) {
      maskedApiKey =
        settings.hostgrapApiKey.length > 4
          ? '****' + settings.hostgrapApiKey.slice(-4)
          : '****';
    }

    return NextResponse.json({
      whatsappEnabled: Boolean(settings.whatsappEnabled),
      hostgrapEmail: settings.hostgrapEmail ?? null,
      hostgrapApiKey: maskedApiKey,
      hostgrapApiUrl: settings.hostgrapApiUrl || 'https://wa-api.hostgrap.com',
      hostgrapTestPhone: settings.hostgrapTestPhone ?? null,
      whatsappCountryCode: settings.whatsappCountryCode || '+94',
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

    let newApiKey = body.hostgrapApiKey;
    if (typeof newApiKey === 'string' && newApiKey.startsWith('****')) {
      newApiKey = currentSettings?.hostgrapApiKey ?? null;
    } else if (newApiKey === undefined) {
      newApiKey = currentSettings?.hostgrapApiKey ?? null;
    } else if (newApiKey === '') {
      newApiKey = null;
    }

    const data = {
      whatsappEnabled: Boolean(body.whatsappEnabled),
      whatsappProvider: 'hostgrap',
      hostgrapEmail: body.hostgrapEmail ?? null,
      hostgrapApiKey: newApiKey,
      hostgrapApiUrl: body.hostgrapApiUrl || 'https://wa-api.hostgrap.com',
      hostgrapTestPhone: body.hostgrapTestPhone ?? null,
      whatsappCountryCode: body.whatsappCountryCode || '+94',
    };

    const updated = currentSettings
      ? await prisma.siteSettings.update({
          where: { id: currentSettings.id },
          data,
        })
      : await prisma.siteSettings.create({
          data,
        });

    let maskedApiKey: string | null = null;
    if (updated.hostgrapApiKey) {
      maskedApiKey =
        updated.hostgrapApiKey.length > 4
          ? '****' + updated.hostgrapApiKey.slice(-4)
          : '****';
    }

    return NextResponse.json({
      whatsappEnabled: updated.whatsappEnabled,
      hostgrapEmail: updated.hostgrapEmail,
      hostgrapApiKey: maskedApiKey,
      hostgrapApiUrl: updated.hostgrapApiUrl,
      hostgrapTestPhone: updated.hostgrapTestPhone,
      whatsappCountryCode: updated.whatsappCountryCode,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
