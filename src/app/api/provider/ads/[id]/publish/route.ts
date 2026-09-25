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
      include: { item: true }
    });

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found or unauthorized' }, { status: 404 });
    }

    if (!ad.item.name || ad.item.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Item must have a name and be active to publish' }, { status: 400 });
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
