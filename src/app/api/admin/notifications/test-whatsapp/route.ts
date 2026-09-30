import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendTestWhatsApp, getHostGrapConfig } from '@/lib/notifications/whatsapp'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await getHostGrapConfig()
    const testPhone = config.testPhone

    if (!testPhone) {
      return NextResponse.json({ error: 'No test phone number configured' }, { status: 400 })
    }

    const testMessage = 'RentHelper WhatsApp test message.\n\nIf you received this message, HostGrap WhatsApp integration is working.'

    const result = await sendTestWhatsApp(testPhone, testMessage)

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Test message sent successfully' : (result.error || 'Failed to send'),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
