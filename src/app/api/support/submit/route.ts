import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

const ALLOWED_CATEGORIES = new Set([
  'BOOKING_ISSUE',
  'PAYMENT_ISSUE',
  'VERIFICATION_HELP',
  'ACCOUNT_RECOVERY',
  'GENERAL_INQUIRY',
  'LOGIN_BLOCKED',
])

function sanitizeText(str: string): string {
  return str.replace(/<[^>]*>?/gm, '').trim()
}

// POST /api/support/submit — Submit a support ticket (Public or Authenticated)
export async function POST(req: NextRequest) {
  try {
    // Body size check — limit 64KB
    const contentLength = parseInt(req.headers.get('content-length') || '0', 10)
    if (contentLength > 64 * 1024) {
      return NextResponse.json({ message: 'Payload size exceeds limit (64KB max).' }, { status: 413 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
    const session = await auth()

    // Database-backed rate limiting check (trailing 15 minutes)
    const trailingWindow = new Date(Date.now() - 15 * 60 * 1000)

    if (session?.user?.id) {
      // Authenticated user rate limit: max 5 tickets per 15 minutes
      const ticketCount = await prisma.supportTicket.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: trailingWindow },
        },
      })

      if (ticketCount >= 5) {
        return NextResponse.json(
          { message: 'Too many support requests. Please try again in 15 minutes.' },
          { status: 429, headers: { 'Retry-After': '900' } }
        )
      }
    } else {
      // Anonymous caller rate limit: max 3 tickets per 15 minutes per IP
      const ticketCount = await prisma.supportTicket.count({
        where: {
          ipAddress: ip,
          createdAt: { gte: trailingWindow },
        },
      })

      if (ticketCount >= 3) {
        return NextResponse.json(
          { message: 'Too many support requests. Please try again in 15 minutes.' },
          { status: 429, headers: { 'Retry-After': '900' } }
        )
      }
    }

    const body = await req.json().catch(() => ({}))
    const { category, subject, description, guestName, guestEmail, guestPhone, sourcePage, attachments } = body

    // Strictly reject attachment uploads
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      return NextResponse.json({ message: 'File attachments are not supported on support submission.' }, { status: 400 })
    }

    if (!category || !subject || !description) {
      return NextResponse.json({ message: 'Category, subject, and description are required.' }, { status: 400 })
    }

    // Category enum validation
    const upperCategory = String(category).trim().toUpperCase()
    if (!ALLOWED_CATEGORIES.has(upperCategory)) {
      return NextResponse.json({ message: 'Invalid support ticket category.' }, { status: 400 })
    }

    // Strict length constraints
    const cleanSubject = sanitizeText(subject).slice(0, 150)
    const cleanDescription = sanitizeText(description).slice(0, 2000)
    const cleanName = guestName ? sanitizeText(guestName).slice(0, 120) : undefined
    const cleanEmail = guestEmail ? sanitizeText(guestEmail).toLowerCase().slice(0, 254) : undefined
    const cleanPhone = guestPhone ? sanitizeText(guestPhone).slice(0, 30) : undefined

    if (!cleanSubject || !cleanDescription) {
      return NextResponse.json({ message: 'Valid non-empty subject and description required.' }, { status: 400 })
    }

    // Email format validation if guest email provided
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 })
    }

    // Fetch site settings to snapshot support email recipient
    const siteSettings = await prisma.siteSettings.findUnique({ where: { id: '1' } })
    const targetSupportEmail = siteSettings?.supportEmail || 'support@renthelper.lk'

    // Generate unique ticket number
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const ticketNumber = `TCK-${new Date().getFullYear()}-${randomNum}`

    // Execute atomic DB transaction: Create Ticket, Ticket Message, and Notification Outbox row
    const ticket = await prisma.$transaction(async (tx) => {
      const createdTicket = await tx.supportTicket.create({
        data: {
          ticketNumber,
          userId: session?.user?.id || null,
          guestName: cleanName || session?.user?.name || undefined,
          guestEmail: cleanEmail || session?.user?.email || undefined,
          guestPhone: cleanPhone || undefined,
          category: upperCategory,
          subject: cleanSubject,
          description: cleanDescription,
          sourcePage: sourcePage ? sanitizeText(sourcePage).slice(0, 200) : undefined,
          ipAddress: ip,
          status: 'OPEN',
          priority: upperCategory === 'LOGIN_BLOCKED' ? 'HIGH' : 'MEDIUM',
        },
      })

      await tx.supportTicketMessage.create({
        data: {
          ticketId: createdTicket.id,
          senderId: session?.user?.id || null,
          senderType: session?.user ? 'USER' : 'GUEST',
          message: cleanDescription,
        },
      })

      // Write NotificationDelivery outbox row for email notification
      await tx.notificationDelivery.create({
        data: {
          channel: 'email',
          type: 'email',
          recipient: targetSupportEmail,
          recipientUserId: session?.user?.id || null,
          recipientType: 'ADMIN',
          eventType: 'SUPPORT_TICKET_CREATED',
          status: 'pending',
          nextAttemptAt: new Date(),
          metadata: {
            ticketId: createdTicket.id,
            ticketNumber: createdTicket.ticketNumber,
            category: upperCategory,
            subject: cleanSubject,
            adminUrl: `/admin/support?id=${createdTicket.id}`,
          },
          idempotencyKey: `SUPPORT_TICKET_CREATED:${createdTicket.id}:support-email`,
        },
      })

      return createdTicket
    })

    return NextResponse.json({
      success: true,
      ticketNumber: ticket.ticketNumber,
      message: 'Support ticket submitted successfully. Our team will get back to you shortly.',
    })
  } catch (error: any) {
    console.error('Error submitting support ticket:', error)
    return NextResponse.json({ message: 'An error occurred while submitting your ticket.' }, { status: 500 })
  }
}
