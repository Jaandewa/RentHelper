import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const ads = await prisma.rentalAd.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      include: {
        item: true,
      }
    });

    return NextResponse.json(ads);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      itemId, title, description, city, address, 
      hourlyPrice, dailyPrice, weeklyPrice, monthlyPrice, 
      securityDeposit, coverImageUrl, galleryImages 
    } = body;

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const ad = await prisma.rentalAd.create({
      data: {
        itemId,
        businessId: business.id,
        title,
        description,
        city,
        address,
        hourlyPrice,
        dailyPrice,
        weeklyPrice,
        monthlyPrice,
        securityDeposit,
        coverImageUrl,
        galleryImages: galleryImages ? JSON.stringify(galleryImages) : null,
        isPublished: false,
        isAvailable: true,
      },
    });

    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
