import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

// PATCH /api/user/theme — persist theme preference (light, dark, system)
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { theme } = body

  if (!theme || !['light', 'dark', 'system'].includes(theme)) {
    return NextResponse.json({ message: 'Valid theme (light, dark, or system) is required' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { themePreference: theme },
  })

  return NextResponse.json({ message: 'Theme preference saved', theme })
}
