import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isValidEventType, validateTemplateVariables } from '@/lib/notifications/template-renderer'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventType: string }> }
) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { eventType } = await params

  if (!isValidEventType(eventType)) {
    return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
  }

  try {
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { eventType },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ eventType: string }> }
) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { eventType } = await params

  if (!isValidEventType(eventType)) {
    return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { isEnabled, messageBody } = body

    if (typeof messageBody !== 'string') {
        return NextResponse.json({ error: 'messageBody must be a string' }, { status: 400 })
    }

    if (messageBody.length > 2000) {
      return NextResponse.json({ error: 'messageBody exceeds 2000 characters' }, { status: 400 })
    }

    const unsupportedVars = validateTemplateVariables(eventType as any, messageBody)
    if (unsupportedVars.length > 0) {
      return NextResponse.json({ error: 'Unsupported variables', unsupportedVars }, { status: 400 })
    }

    // Sanitize: strip HTML tags but preserve line breaks
    const sanitizedMessageBody = messageBody.replace(/<[^>]*>?/gm, '')

    const updatedBy = session.user?.email || session.user?.name || 'admin'

    const template = await prisma.whatsAppTemplate.update({
      where: { eventType },
      data: {
        isEnabled: isEnabled ?? true,
        messageBody: sanitizedMessageBody,
        updatedBy,
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
