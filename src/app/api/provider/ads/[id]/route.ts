import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireVerifiedProviderAccess } from '@/lib/provider-guard';

export const runtime = 'nodejs'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, business } = await requireVerifiedProviderAccess();
    if (error) return error;

    const { id } = await params;

    const existingAd = await prisma.rentalAd.findFirst({
      where: { id, businessId: business.id },
    });

    if (!existingAd) {
      return NextResponse.json({ error: 'Ad not found or unauthorized' }, { status: 404 });
    }

    const data = await req.json();

    const ad = await prisma.rentalAd.update({
      where: { id },
      data,
    });

    return NextResponse.json(ad);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, business } = await requireVerifiedProviderAccess();
    if (error) return error;

    const { id } = await params;

    const existingAd = await prisma.rentalAd.findFirst({
      where: { id, businessId: business.id },
    });

    if (!existingAd) {
      return NextResponse.json({ error: 'Ad not found or unauthorized' }, { status: 404 });
    }

    await prisma.rentalAd.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
