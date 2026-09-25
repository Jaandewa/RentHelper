import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role?.toLowerCase()
    if (role !== 'provider' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const ads = await prisma.rentalAd.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      include: {
        item: true,
      },
    })

    return NextResponse.json(ads)
  } catch (error) {
    console.error('Error fetching provider ads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role?.toLowerCase()
    if (role !== 'provider' && role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden — Providers only' }, { status: 403 })
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    })

    if (!business) {
      return NextResponse.json({ message: 'Business profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const { 
      itemId, title, description, city, address, 
      hourlyPrice, dailyPrice, weeklyPrice, monthlyPrice, 
      securityDeposit, coverImageUrl, galleryImages 
    } = body

    if (!itemId) {
      return NextResponse.json({ message: 'itemId is required' }, { status: 400 })
    }

    // Verify item ownership and status
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        category: true,
        itemImages: true,
      },
    })

    if (!item || item.businessId !== business.id) {
      return NextResponse.json({ message: 'Item not found or does not belong to your business' }, { status: 404 })
    }

    if (item.status === 'damaged' || item.status === 'retired' || item.status === 'maintenance') {
      return NextResponse.json({ message: `Cannot publish item with status "${item.status}"` }, { status: 400 })
    }

    const finalTitle = title || item.name
    const finalCover = coverImageUrl || item.itemImages?.[0]?.url || ''
    const finalDaily = dailyPrice || item.dailyRate || 0
    const finalCity = city || business.city || 'Colombo'

    if (!finalTitle) {
      return NextResponse.json({ message: 'Item title is required' }, { status: 400 })
    }

    if (!finalDaily && !hourlyPrice && !weeklyPrice && !monthlyPrice) {
      return NextResponse.json({ message: 'At least one rental price is required to post ad' }, { status: 400 })
    }

    // Check if ad already exists for this itemId
    const existingAd = await prisma.rentalAd.findUnique({
      where: { itemId },
    })

    let ad: any

    if (existingAd) {
      // Update existing ad
      ad = await prisma.rentalAd.update({
        where: { id: existingAd.id },
        data: {
          title: finalTitle,
          description: description || item.description || '',
          city: finalCity,
          address: address || business.address || '',
          hourlyPrice: hourlyPrice || item.hourlyRate || null,
          dailyPrice: finalDaily,
          weeklyPrice: weeklyPrice || item.weeklyRate || null,
          monthlyPrice: monthlyPrice || item.monthlyRate || null,
          securityDeposit: securityDeposit || item.depositAmount || 0,
          coverImageUrl: finalCover,
          galleryImages: galleryImages ? (typeof galleryImages === 'string' ? galleryImages : JSON.stringify(galleryImages)) : existingAd.galleryImages,
          isPublished: true,
          isAvailable: true,
        },
      })
    } else {
      // Create new ad
      ad = await prisma.rentalAd.create({
        data: {
          itemId,
          businessId: business.id,
          title: finalTitle,
          description: description || item.description || '',
          city: finalCity,
          address: address || business.address || '',
          hourlyPrice: hourlyPrice || item.hourlyRate || null,
          dailyPrice: finalDaily,
          weeklyPrice: weeklyPrice || item.weeklyRate || null,
          monthlyPrice: monthlyPrice || item.monthlyRate || null,
          securityDeposit: securityDeposit || item.depositAmount || 0,
          coverImageUrl: finalCover,
          galleryImages: galleryImages ? (typeof galleryImages === 'string' ? galleryImages : JSON.stringify(galleryImages)) : null,
          isPublished: true,
          isAvailable: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      ad: {
        id: ad.id,
        isPublished: ad.isPublished,
        publicUrl: `/marketplace/${ad.id}`,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error posting ad:', error)
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 })
  }
}
