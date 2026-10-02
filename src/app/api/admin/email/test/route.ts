/**
 * POST /api/admin/email/test
 * 
 * Send a test email using the saved SMTP configuration.
 * Admin-only. Sends to the admin's own email address.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST() {
  try {
    const session = await auth()
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const adminEmail = session.user.email
    if (!adminEmail) {
      return NextResponse.json(
        { success: false, error: 'No email address associated with your admin account.' },
        { status: 400 }
      )
    }

    const result = await sendEmail({
      to: adminEmail,
      subject: 'RentHelper SMTP Test',
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 20px;">RentHelper</h1>
  </div>
  <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1f2937; margin-top: 0; font-size: 18px;">✅ SMTP Test Successful</h2>
    <p style="color: #4b5563;">This is a test email from RentHelper.</p>
    <p style="color: #4b5563;">If you received this, SMTP configuration is working.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
    <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
      Sent at ${new Date().toISOString()} from Admin → Site Settings → Email/SMTP
    </p>
  </div>
</div>`,
      text: 'This is a test email from RentHelper.\n\nIf you received this, SMTP configuration is working.',
    })

    if (result.notConfigured) {
      return NextResponse.json(
        { success: false, error: 'SMTP is not configured. Please fill in all SMTP fields and save before testing.' },
        { status: 400 }
      )
    }

    if (!result.success) {
      // Sanitize error — never expose credentials
      let safeError = result.error || 'Unknown error'
      // Strip anything that looks like a password or credential from the error message
      safeError = safeError.replace(/pass(word)?[=:\s].*/gi, 'pass***')
      safeError = safeError.replace(/auth[=:\s].*/gi, 'auth***')

      return NextResponse.json(
        { success: false, error: `SMTP delivery failed: ${safeError}` },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, message: 'Test email sent successfully.' })
  } catch (error: any) {
    console.error('[Admin Email Test] Error:', error.message)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while sending the test email.' },
      { status: 500 }
    )
  }
}
