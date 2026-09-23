import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// GET /api/admin/settings — fetch site settings (singleton id="1")
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  let settings = await prisma.siteSettings.findUnique({ where: { id: '1' } })

  // Auto-create defaults if not present
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { id: '1' },
    })
  }

  // Mask sensitive fields
  const masked = {
    ...settings,
    googleClientSecret: settings.googleClientSecret ? '••••••••' : null,
    smtpPass: settings.smtpPass ? '••••••••' : null,
  }

  return NextResponse.json({ settings: masked })
}

// PATCH /api/admin/settings — update site settings
export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const body = await req.json()

  // Don't overwrite masked values if unchanged
  if (body.googleClientSecret === '••••••••') delete body.googleClientSecret
  if (body.smtpPass === '••••••••') delete body.smtpPass

  const settings = await prisma.siteSettings.upsert({
    where: { id: '1' },
    create: { id: '1', ...body, updatedBy: session!.user.id },
    update: { ...body, updatedBy: session!.user.id },
  })

  return NextResponse.json({ settings, message: 'Settings saved' })
}
