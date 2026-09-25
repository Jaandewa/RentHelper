import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

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
