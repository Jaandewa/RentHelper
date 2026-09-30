/**
 * Review Service
 * 
 * Handles submission of ratings, recalculation of averages,
 * and trust score updates.
 */

import prisma from '@/lib/prisma'
import { sendReviewSubmittedWhatsApp } from '@/lib/notifications/whatsapp'

// ── Submit Provider Rating (Customer rates Provider) ─────────────────────

export async function submitProviderRating(params: {
  userId: string        // authenticated customer's user ID
  bookingId: string
  overallScore: number  // 1-5
  reviewText?: string
}): Promise<{ success: boolean; error?: string; rating?: any }> {
  const { userId, bookingId, overallScore, reviewText } = params

  // Validate rating
  if (!overallScore || overallScore < 1 || overallScore > 5 || !Number.isInteger(overallScore)) {
    return { success: false, error: 'Rating must be an integer between 1 and 5' }
  }

  if (reviewText && reviewText.length > 500) {
    return { success: false, error: 'Review text must be 500 characters or less' }
  }

  // Get booking with relations
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: { include: { user: true } },
      business: true,
      bookingItems: { include: { item: true } },
      providerRating: true,
    },
  })

  if (!booking) return { success: false, error: 'Booking not found' }

  // Verify customer owns this booking
  if (booking.customer.userId !== userId) {
    return { success: false, error: 'You can only review your own bookings' }
  }

  // Verify booking is completed
  if (booking.status !== 'completed') {
    return { success: false, error: 'You can only review completed bookings' }
  }

  // Check for duplicate
  if (booking.providerRating || booking.customerReviewed) {
    return { success: false, error: 'You have already reviewed this booking' }
  }

  // Sanitize review text
  const sanitizedText = reviewText?.trim().replace(/<[^>]*>/g, '') || null

  // Create rating — use overallScore for all sub-scores (single star picker)
  const rating = await prisma.providerRating.create({
    data: {
      bookingId,
      businessId: booking.businessId,
      customerId: booking.customerId,
      itemQualityScore: overallScore,
      valueScore: overallScore,
      serviceScore: overallScore,
      cleanlinessScore: overallScore,
      overallScore,
      review: sanitizedText,
    },
  })

  // Mark booking as reviewed
  await prisma.booking.update({
    where: { id: bookingId },
    data: { customerReviewed: true },
  })

  // Recalculate business average
  await recalculateBusinessRating(booking.businessId)

  // WhatsApp notification to provider (non-blocking)
  if (booking.business && booking.business.phone) {
    const customerName = booking.customer?.user?.name || 'Customer'
    const itemName = booking.bookingItems?.[0]?.item?.name || 'Rental item'
    sendReviewSubmittedWhatsApp(booking.business.phone, {
      reviewerName: customerName,
      rating: overallScore,
      itemName,
      bookingNumber: booking.bookingNumber,
    }).catch(e => console.error('[Review Service] Provider WhatsApp notification failed:', e))
  }

  return { success: true, rating }
}

// ── Submit Customer Rating (Provider rates Customer) ─────────────────────

export async function submitCustomerRating(params: {
  userId: string        // authenticated provider's user ID
  bookingId: string
  overallScore: number  // 1-5
  reviewText?: string
}): Promise<{ success: boolean; error?: string; rating?: any }> {
  const { userId, bookingId, overallScore, reviewText } = params

  // Validate rating
  if (!overallScore || overallScore < 1 || overallScore > 5 || !Number.isInteger(overallScore)) {
    return { success: false, error: 'Rating must be an integer between 1 and 5' }
  }

  if (reviewText && reviewText.length > 500) {
    return { success: false, error: 'Review text must be 500 characters or less' }
  }

  // Get booking with relations
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      business: true,
      customer: { include: { user: true } },
      bookingItems: { include: { item: true } },
      customerRating: true,
    },
  })

  if (!booking) return { success: false, error: 'Booking not found' }

  // Verify provider owns the business for this booking
  if (booking.business.userId !== userId) {
    return { success: false, error: 'You can only review bookings for your business' }
  }

  // Verify booking is completed
  if (booking.status !== 'completed') {
    return { success: false, error: 'You can only review completed bookings' }
  }

  // Check for duplicate
  if (booking.customerRating || booking.providerReviewed) {
    return { success: false, error: 'You have already reviewed this customer for this booking' }
  }

  // Sanitize review text
  const sanitizedText = reviewText?.trim().replace(/<[^>]*>/g, '') || null

  // Create rating — use overallScore for all sub-scores
  const rating = await prisma.customerRating.create({
    data: {
      bookingId,
      providerId: booking.businessId,
      customerId: booking.customerId,
      conditionScore: overallScore,
      timelinessScore: overallScore,
      communicationScore: overallScore,
      overallScore,
      review: sanitizedText,
    },
  })

  // Mark booking as reviewed
  await prisma.booking.update({
    where: { id: bookingId },
    data: { providerReviewed: true },
  })

  // Recalculate customer average + trust score
  await recalculateCustomerRating(booking.customerId)

  // WhatsApp notification to customer (non-blocking)
  if (booking.customer?.phone) {
    const providerName = booking.business?.name || 'Provider'
    const itemName = booking.bookingItems?.[0]?.item?.name || 'Rental item'
    sendReviewSubmittedWhatsApp(booking.customer.phone, {
      reviewerName: providerName,
      rating: overallScore,
      itemName,
      bookingNumber: booking.bookingNumber,
    }).catch(e => console.error('[Review Service] Customer WhatsApp notification failed:', e))
  }

  return { success: true, rating }
}

// ── Recalculate Business Rating ──────────────────────────────────────────

export async function recalculateBusinessRating(businessId: string): Promise<void> {
  try {
    const ratings = await prisma.providerRating.findMany({
      where: { businessId },
      select: { overallScore: true },
    })

    const totalReviews = ratings.length
    const averageRating = totalReviews > 0
      ? ratings.reduce((sum, r) => sum + r.overallScore, 0) / totalReviews
      : 0

    await prisma.business.update({
      where: { id: businessId },
      data: {
        averageRating: Math.round(averageRating * 10) / 10, // 1 decimal
        totalReviews,
      },
    })
  } catch (e) {
    console.error('[Review Service] recalculateBusinessRating error:', e)
  }
}

// ── Recalculate Customer Rating + Trust Score ────────────────────────────

export async function recalculateCustomerRating(customerId: string): Promise<void> {
  try {
    const ratings = await prisma.customerRating.findMany({
      where: { customerId },
      select: { overallScore: true },
    })

    const totalReviews = ratings.length
    const averageRating = totalReviews > 0
      ? ratings.reduce((sum, r) => sum + r.overallScore, 0) / totalReviews
      : 0

    const roundedAvg = Math.round(averageRating * 10) / 10

    // Calculate trust score
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      include: { user: true },
    })

    let trustScore = 0

    // Base scores
    if (customer?.kycStatus === 'verified') trustScore += 20
    if (customer?.user?.emailVerified) trustScore += 10
    if (customer?.phone) trustScore += 10

    // Rating bonus
    if (roundedAvg >= 4.5) trustScore += 30
    else if (roundedAvg >= 4.0) trustScore += 20
    else if (roundedAvg >= 3.5) trustScore += 10
    else if (roundedAvg >= 3.0) trustScore += 5

    // Booking history bonus
    if (customer?.totalBookings && customer.totalBookings >= 10) trustScore += 10
    else if (customer?.totalBookings && customer.totalBookings >= 5) trustScore += 5

    await prisma.customerProfile.update({
      where: { id: customerId },
      data: {
        averageRating: roundedAvg,
        totalReviews,
        trustScore,
      },
    })
  } catch (e) {
    console.error('[Review Service] recalculateCustomerRating error:', e)
  }
}
