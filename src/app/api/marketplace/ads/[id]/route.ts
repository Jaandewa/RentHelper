import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Increment viewsCount
    await prisma.rentalAd.updateMany({
      where: { id },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    });

    const ad = await prisma.rentalAd.findUnique({
      where: { id },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            conditionGrade: true,
            itemImages: true,
            category: true,
            status: true,
          }
        },
        business: {
          select: {
            id: true,
            name: true,
            city: true,
            logo: true,
            slug: true,
          }
        },
      }
    });

    if (!ad || !ad.isPublished || !ad.isAvailable) {
      return NextResponse.json({ error: 'Ad not found or unavailable' }, { status: 404 });
    }

    return NextResponse.json(ad);
  } catch (error) {
    console.error('Error fetching ad details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
