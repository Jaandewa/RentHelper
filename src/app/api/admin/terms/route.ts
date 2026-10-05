import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// GET /api/admin/terms — fetch platform terms versions
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const termsVersions = await prisma.platformTermsVersion.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const activeTerms = termsVersions.find((t) => t.isPublished) || null

  return NextResponse.json({ termsVersions, activeTerms })
}

// POST /api/admin/terms — create platform terms version draft
export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { version, title, content } = body

  if (!version || !content) {
    return NextResponse.json({ message: 'Version and content are required' }, { status: 400 })
  }

  const newTerms = await prisma.platformTermsVersion.create({
    data: {
      version: version.trim(),
      title: (title || 'Platform Terms of Service').trim(),
      content: content.trim(),
      isPublished: false,
      createdBy: session!.user.id,
    },
  })

  return NextResponse.json({ terms: newTerms, message: 'Platform terms version created' })
}

// PATCH /api/admin/terms — publish platform terms version
export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { termsId } = body

  if (!termsId) {
    return NextResponse.json({ message: 'termsId is required' }, { status: 400 })
  }

  // Unpublish all previous platform terms
  await prisma.platformTermsVersion.updateMany({
    data: { isPublished: false },
  })

  // Publish target version
  const publishedTerms = await prisma.platformTermsVersion.update({
    where: { id: termsId },
    data: {
      isPublished: true,
      publishedAt: new Date(),
    },
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session!.user.id,
      action: 'PUBLISH_PLATFORM_TERMS',
      entityType: 'PLATFORM_TERMS',
      entityId: publishedTerms.id,
      details: JSON.stringify({ version: publishedTerms.version }),
    },
  })

  return NextResponse.json({ terms: publishedTerms, message: 'Platform terms published' })
}
