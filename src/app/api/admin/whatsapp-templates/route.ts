import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { seedDefaultTemplates } from '@/lib/notifications/template-renderer'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Auto-seed missing defaults
    await seedDefaultTemplates()

    const templates = await prisma.whatsAppTemplate.findMany({
      orderBy: { eventType: 'asc' },
    })
    return NextResponse.json({ templates })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
