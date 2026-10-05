import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireVerifiedProviderAccess } from '@/lib/provider-guard';

export const runtime = 'nodejs'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, business } = await requireVerifiedProviderAccess();
    if (error) return error;

    const { id } = await params;

    const ad = await prisma.rentalAd.findFirst({
      where: { id, businessId: business.id },
      include: { item: true }
    });

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found or unauthorized' }, { status: 404 });
    }

    if (!ad.item.name || ad.item.status === 'retired' || ad.item.status === 'damaged') {
      return NextResponse.json({ error: 'Item must have a name and not be retired/damaged to publish' }, { status: 400 });
    }

    if (!ad.hourlyPrice && !ad.dailyPrice && !ad.weeklyPrice && !ad.monthlyPrice) {
      return NextResponse.json({ error: 'Ad must have at least one price set' }, { status: 400 });
    }

    const publishedAd = await prisma.rentalAd.update({
      where: { id },
      data: { isPublished: true },
    });

    return NextResponse.json(publishedAd);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
