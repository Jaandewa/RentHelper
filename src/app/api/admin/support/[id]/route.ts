import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// GET /api/admin/support/[id] — fetch single ticket detail with messages
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
    },
  })

  if (!ticket) return NextResponse.json({ message: 'Ticket not found' }, { status: 404 })
  return NextResponse.json({ ticket })
}

// POST /api/admin/support/[id] — post response message or internal note
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const { message, isInternal } = body

  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ message: 'Message content is required' }, { status: 400 })
  }

  const newMessage = await prisma.supportTicketMessage.create({
    data: {
      ticketId: id,
      senderId: session!.user.id,
      senderType: 'ADMIN',
      message: message.trim(),
      isInternal: Boolean(isInternal),
    },
  })

  // If public response, update status to WAITING_USER if open
  if (!isInternal) {
    await prisma.supportTicket.update({
      where: { id },
      data: { status: 'IN_PROGRESS', assignedTo: session!.user.id },
    })
  }

  return NextResponse.json({ message: newMessage, status: 'Saved' })
}

// PATCH /api/admin/support/[id] — update status or priority
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const { status, priority, assignedTo } = body

  const dataToUpdate: any = {}
  if (status) {
    dataToUpdate.status = status
    if (status === 'RESOLVED' || status === 'CLOSED') {
      dataToUpdate.resolvedAt = new Date()
    }
  }
  if (priority) dataToUpdate.priority = priority
  if (assignedTo !== undefined) dataToUpdate.assignedTo = assignedTo

  const updatedTicket = await prisma.supportTicket.update({
    where: { id },
    data: dataToUpdate,
  })

  await prisma.activityLog.create({
    data: {
      userId: session!.user.id,
      action: 'UPDATE_SUPPORT_TICKET',
      entityType: 'SUPPORT_TICKET',
      entityId: id,
      details: JSON.stringify(dataToUpdate),
    },
  })

  return NextResponse.json({ ticket: updatedTicket, message: 'Ticket updated' })
}
