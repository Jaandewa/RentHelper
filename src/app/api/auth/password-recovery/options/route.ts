import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createHash, randomBytes } from 'crypto'
import {
  normalizePhoneInternational,
  maskPhoneForDisplay,
  maskEmailForDisplay,
  detectIdentifierType,
  normalizeIdentityNumber
} from '@/lib/phone'
import { normalizeSriLankanPhone } from '@/lib/otp'

const GENERIC_RESPONSE = {
  success: true,
  hasRecoveryOptions: false,
  message: 'If an eligible account was found, password recovery options are available.'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { identifier, sessionToken: providedSessionToken } = body

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid identifier' },
        { status: 400 }
      )
    }

    const type = detectIdentifierType(identifier)
    let normalized = identifier

    if (type === 'email') {
      normalized = identifier.trim().toLowerCase()
    } else if (type === 'phone') {
      const international = normalizePhoneInternational(identifier)
      normalized = international || normalizeSriLankanPhone(identifier) || identifier.trim()
    } else {
      normalized = normalizeIdentityNumber(identifier)
    }

    const identifierHash = createHash('sha256').update(normalized).digest('hex')
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000)

    // Rate limiting: 1. By identifierHash
    const recentRequestsByIdentifier = await prisma.passwordRecoveryRequest.count({
      where: {
        identifierHash,
        createdAt: { gte: fifteenMinsAgo }
      }
    })

    if (recentRequestsByIdentifier >= 3) {
      return NextResponse.json(GENERIC_RESPONSE)
    }

    // Rate limiting: 2. By IP
    const recentRequestsByIp = await prisma.notificationDelivery.count({
      where: {
        eventType: 'PASSWORD_RECOVERY_OPTIONS_REQUESTED',
        createdAt: { gte: fifteenMinsAgo },
        metadata: { path: ['clientIP'], equals: ip }
      }
    })

    if (recentRequestsByIp >= 5) {
      return NextResponse.json(GENERIC_RESPONSE)
    }

    let user = null

    if (type === 'email') {
      user = await prisma.user.findUnique({
        where: { email: normalized },
        include: { customerProfile: true, businessProfile: true }
      })
    } else if (type === 'phone') {
      let customerProfile = await prisma.customerProfile.findFirst({
        where: { normalizedPhone: normalized }
      })
      let business = null

      if (!customerProfile) {
        business = await prisma.business.findFirst({
          where: { normalizedPhone: normalized }
        })
      }

      const foundUserId = customerProfile?.userId || business?.userId
      if (foundUserId) {
        user = await prisma.user.findUnique({
          where: { id: foundUserId },
          include: { customerProfile: true, businessProfile: true }
        })
      }
    } else {
      const identityType = type === 'nic' ? 'NIC' : 'PASSPORT'
      let profile = await prisma.customerProfile.findFirst({
        where: {
          OR: [
            { normalizedIdentityNumber: normalized, identityType },
            { nicNumber: normalized } // legacy
          ]
        }
      })
      if (profile) {
        user = await prisma.user.findUnique({
          where: { id: profile.userId },
          include: { customerProfile: true, businessProfile: true }
        })
      }
    }

    if (!user) {
      return NextResponse.json(GENERIC_RESPONSE)
    }

    const channels: Array<{ id: string; label: string }> = []
    const availableChannelIds: string[] = []

    // Email channel: eligible if account has a registered email
    // Registration stores email but does not set emailVerified (only OAuth does)
    if (user.email) {
      channels.push({
        id: 'email',
        label: 'Email: ' + maskEmailForDisplay(user.email)
      })
      availableChannelIds.push('email')
    }

    const phone = user.customerProfile?.normalizedPhone || user.businessProfile?.normalizedPhone || user.customerProfile?.phone || user.businessProfile?.phone
    const phoneVerified = user.customerProfile?.phoneVerified || user.businessProfile?.phoneVerified

    if (phone && phoneVerified) {
      channels.push({
        id: 'whatsapp',
        label: 'WhatsApp: ' + maskPhoneForDisplay(phone)
      })
      availableChannelIds.push('whatsapp')
    }

    if (channels.length === 0) {
      return NextResponse.json(GENERIC_RESPONSE)
    }

    const sessionToken = providedSessionToken || randomBytes(16).toString('hex')
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    const record = await prisma.passwordRecoveryRequest.create({
      data: {
        userId: user.id,
        identifierHash,
        sessionToken,
        availableChannels: JSON.stringify(availableChannelIds),
        expiresAt
      }
    })

    await prisma.notificationDelivery.create({
      data: {
        type: 'system_log',
        eventType: 'PASSWORD_RECOVERY_OPTIONS_REQUESTED',
        channel: 'system',
        status: 'sent',
        recipient: identifierHash.slice(0, 10),
        metadata: { clientIP: ip },
        sentAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      hasRecoveryOptions: true,
      recoveryRequestId: record.id,
      channels,
      sessionToken
    })
  } catch (error) {
    console.error('Password recovery options error:', error)
    return NextResponse.json(GENERIC_RESPONSE)
  }
}
