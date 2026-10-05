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
    });

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found or unauthorized' }, { status: 404 });
    }

    const unpublishedAd = await prisma.rentalAd.update({
      where: { id },
      data: { isPublished: false },
    });

    return NextResponse.json(unpublishedAd);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
