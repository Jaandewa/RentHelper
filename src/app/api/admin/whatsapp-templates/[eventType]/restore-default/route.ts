import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isValidEventType } from '@/lib/notifications/template-renderer'
import { DEFAULT_TEMPLATES, EVENT_VARIABLES } from '@/lib/notifications/template-defaults'

export async function POST(
  req: NextRequest,
  { params }: { params: { eventType: string } }
) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { eventType } = params

  if (!isValidEventType(eventType)) {
    return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
  }

  try {
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.eventType === eventType)
    
    if (!defaultTemplate) {
        return NextResponse.json({ error: 'Default template not found for event type' }, { status: 404 })
    }

    const template = await prisma.whatsAppTemplate.upsert({
      where: { eventType },
      create: {
        eventType: defaultTemplate.eventType,
        name: defaultTemplate.name,
        description: defaultTemplate.description,
        messageBody: defaultTemplate.messageBody,
        isEnabled: true,
      },
      update: {
        name: defaultTemplate.name,
        description: defaultTemplate.description,
        messageBody: defaultTemplate.messageBody,
        isEnabled: true,
      }
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
