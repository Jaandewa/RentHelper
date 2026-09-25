import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

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
    const session = await auth();
    if (!session || session.user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

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
