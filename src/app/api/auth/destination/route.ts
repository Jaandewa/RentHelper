import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserDestination } from '@/lib/auth/getUserDestination'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ destination: '/auth/signin' }, { status: 401 })
    }

    const destination = await getUserDestination(session.user.id)
    return NextResponse.json({ destination })
  } catch (error) {
    console.error('Error fetching auth destination:', error)
    return NextResponse.json({ destination: '/' }, { status: 500 })
  }
}
