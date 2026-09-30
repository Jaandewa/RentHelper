import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { submitProviderRating } from '@/lib/reviews/service'

export async function POST(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId } = await params
    const body = await req.json()
    const { rating, reviewText } = body

    const result = await submitProviderRating({
      userId: session.user.id,
      bookingId,
      overallScore: rating,
      reviewText,
    })

    if (!result.success) {
      const status = result.error?.includes('already') ? 409 :
                     result.error?.includes('own') ? 403 :
                     result.error?.includes('not found') ? 404 : 400
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ success: true, rating: result.rating }, { status: 201 })
  } catch (error) {
    console.error('Review provider error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
