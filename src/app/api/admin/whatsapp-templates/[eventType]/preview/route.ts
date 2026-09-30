import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isValidEventType, previewTemplate } from '@/lib/notifications/template-renderer'
import { PREVIEW_VALUES, EVENT_VARIABLES } from '@/lib/notifications/template-defaults'

export async function POST(
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
    const { messageBody } = body

    if (typeof messageBody !== 'string') {
      return NextResponse.json({ error: 'messageBody is required and must be a string' }, { status: 400 })
    }

    const previewResult = previewTemplate(messageBody, eventType, PREVIEW_VALUES)
    
    return NextResponse.json(previewResult) // { rendered, unsupportedVars }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
