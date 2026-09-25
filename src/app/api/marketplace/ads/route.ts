import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const where: any = {
      isPublished: true,
      isAvailable: true,
    };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    
    if (city) {
      where.city = city;
    }

    if (minPrice || maxPrice) {
      where.dailyPrice = {};
      if (minPrice) where.dailyPrice.gte = parseFloat(minPrice);
      if (maxPrice) where.dailyPrice.lte = parseFloat(maxPrice);
    }

    if (category) {
      where.item = {
        category: { slug: category },
      };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') {
      orderBy = { dailyPrice: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { dailyPrice: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const skip = (page - 1) * limit;

    const [ads, total] = await Promise.all([
      prisma.rentalAd.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          item: {
            select: {
              name: true,
              conditionGrade: true,
              itemImages: true,
            },
          },
          business: {
            select: {
              name: true,
              city: true,
              logo: true,
              slug: true,
            },
          },
        },
      }),
      prisma.rentalAd.count({ where }),
    ]);

    return NextResponse.json({
      ads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching marketplace ads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
