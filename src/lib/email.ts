/**
 * Email Service
 * 
 * Sends emails using SMTP configuration stored in SiteSettings.
 * Falls back gracefully when SMTP is not configured.
 */

import nodemailer from 'nodemailer'
import prisma from '@/lib/prisma'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface EmailResult {
  success: boolean
  notConfigured?: boolean
  error?: string
}

async function getSMTPConfig() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: '1' } })
  if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) {
    return null
  }
  return {
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: (settings.smtpPort || 587) === 465,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
    from: `"${settings.emailFromName || 'RentHelper'}" <${settings.emailFromAddress || 'noreply@renthelper.lk'}>`,
  }
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const config = await getSMTPConfig()
    
    if (!config) {
      return { success: false, notConfigured: true, error: 'SMTP not configured' }
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    })

    await transporter.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    return { success: true }
  } catch (error: any) {
    console.error('[Email] Send failed:', error.message)
    return { success: false, error: error.message }
  }
}

export function buildPasswordResetEmail(resetUrl: string, appName: string = 'RentHelper'): { subject: string; html: string; text: string } {
  const subject = `Reset your ${appName} password`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${appName}</h1>
  </div>
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Reset Password</a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">This link expires in 30 minutes and can only be used once.</p>
    <p style="color: #6b7280; font-size: 14px;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #9ca3af; font-size: 12px;">If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="color: #9ca3af; font-size: 12px; word-break: break-all;">${resetUrl}</p>
  </div>
</body>
</html>`

  const text = `Reset Your ${appName} Password\n\nWe received a request to reset your password. Visit this link to create a new password:\n\n${resetUrl}\n\nThis link expires in 30 minutes and can only be used once.\n\nIf you did not request a password reset, please ignore this email.`

  return { subject, html, text }
}
