import { NextResponse } from 'next/server'
import { submitCustomerRating } from '@/lib/reviews/service'
import { requireVerifiedProviderAccess } from '@/lib/provider-guard'

export const runtime = 'nodejs'

export async function POST(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { error, user } = await requireVerifiedProviderAccess()
    if (error) return error

    const { bookingId } = await params
    const body = await req.json()
    const { rating, reviewText } = body

    const result = await submitCustomerRating({
      userId: user.id,
      bookingId,
      overallScore: rating,
      reviewText,
    })

    if (!result.success) {
      const status = result.error?.includes('already') ? 409 :
                     result.error?.includes('own') || result.error?.includes('your business') ? 403 :
                     result.error?.includes('not found') ? 404 : 400
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ success: true, rating: result.rating }, { status: 201 })
  } catch (error) {
    console.error('Review customer error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
