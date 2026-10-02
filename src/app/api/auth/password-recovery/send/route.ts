import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createHash, randomBytes } from 'crypto'
import { sendEmail, buildPasswordResetEmail } from '@/lib/email'
import { sendTemplatedWhatsApp } from '@/lib/notifications/whatsapp'

const GENERIC_RESPONSE = {
  success: true,
  message: 'If the selected verified contact method is available, password-reset instructions have been sent.'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { recoveryRequestId, channel, sessionToken } = body

    if (!recoveryRequestId || !channel || !sessionToken) {
      return NextResponse.json(
        { success: false, message: 'Missing parameters' },
        { status: 400 }
      )
    }

    const requestRecord = await prisma.passwordRecoveryRequest.findUnique({
      where: { id: recoveryRequestId }
    })

    if (!requestRecord) {
      return NextResponse.json(GENERIC_RESPONSE)
    }

    if (
      requestRecord.sessionToken !== sessionToken ||
      requestRecord.expiresAt < new Date() ||
      requestRecord.sentAt !== null
    ) {
      return NextResponse.json(GENERIC_RESPONSE)
    }

    const availableChannels = JSON.parse(requestRecord.availableChannels as string) || []
    if (!availableChannels.includes(channel)) {
      return NextResponse.json(GENERIC_RESPONSE)
    }

    const user = await prisma.user.findUnique({
      where: { id: requestRecord.userId },
      include: { customerProfile: true, businessProfile: true }
    })

    if (!user) {
      return NextResponse.json(GENERIC_RESPONSE)
    }

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() }
    })

    const rawToken = randomBytes(32).toString('base64url')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      }
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rent.healingcity.lk'
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`

    if (channel === 'email') {
      if (user.email) {
        const emailContent = buildPasswordResetEmail(resetUrl)
        const emailResult = await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        })
        
        await prisma.notificationDelivery.create({
          data: {
            type: 'email',
            eventType: 'PASSWORD_RESET_SENT',
            channel: 'email',
            status: emailResult.success ? 'sent' : emailResult.notConfigured ? 'not_configured' : 'failed',
            error: emailResult.error || null,
            recipient: user.email,
            recipientUserId: user.id,
            sentAt: emailResult.success ? new Date() : null,
          }
        })
      }
    } else if (channel === 'whatsapp') {
      const phone = user.customerProfile?.normalizedPhone || user.businessProfile?.normalizedPhone
      if (phone) {
        await sendTemplatedWhatsApp(phone, 'PASSWORD_RESET', {
          appName: 'RentHelper',
          resetUrl,
          expiryMinutes: '30',
          supportContact: process.env.SUPPORT_CONTACT || '+94 77 123 4567'
        })
        
        await prisma.notificationDelivery.create({
          data: {
            type: 'whatsapp_text',
            eventType: 'PASSWORD_RESET_SENT',
            channel: 'whatsapp',
            status: 'sent',
            recipient: phone,
            recipientUserId: user.id,
            sentAt: new Date()
          }
        })
      }
    }

    await prisma.passwordRecoveryRequest.update({
      where: { id: requestRecord.id },
      data: {
        sentAt: new Date(),
        selectedChannel: channel
      }
    })

    return NextResponse.json(GENERIC_RESPONSE)

  } catch (error) {
    console.error('Password recovery send error:', error)
    return NextResponse.json(GENERIC_RESPONSE)
  }
}
