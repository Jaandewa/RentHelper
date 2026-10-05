import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireVerifiedProviderAccess } from '@/lib/provider-guard'

export const runtime = 'nodejs'

// GET /api/provider/terms — fetch provider terms versions
export async function GET() {
  const { error, user, business } = await requireVerifiedProviderAccess()
  if (error) return error

  const termsVersions = await prisma.providerTermsVersion.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  })

  const activeTerms = termsVersions.find((t) => t.isPublished) || null

  return NextResponse.json({
    termsVersions,
    activeTerms,
    legacyCancellationPolicy: (business as any).cancellationPolicy ?? null,
    legacyDepositPolicy: (business as any).depositPolicy ?? null,
  })
}

// POST /api/provider/terms — create a new terms draft
export async function POST(req: NextRequest) {
  const { error, user, business } = await requireVerifiedProviderAccess()
  if (error) return error

  const body = await req.json()
  const { version, title, content } = body

  if (!version || !content) {
    return NextResponse.json({ message: 'Version and content are required' }, { status: 400 })
  }

  const newTerms = await prisma.providerTermsVersion.create({
    data: {
      businessId: business.id,
      version: version.trim(),
      title: (title || 'Standard Rental Agreement & Policy').trim(),
      content: content.trim(),
      isPublished: false,
      createdBy: user.id,
    },
  })

  return NextResponse.json({ terms: newTerms, message: 'Draft created successfully' })
}

// PATCH /api/provider/terms — publish a terms version
export async function PATCH(req: NextRequest) {
  const { error, user, business } = await requireVerifiedProviderAccess()
  if (error) return error

  const body = await req.json()
  const { termsId } = body

  if (!termsId) {
    return NextResponse.json({ message: 'termsId is required' }, { status: 400 })
  }

  // Unpublish all previous versions for this business
  await prisma.providerTermsVersion.updateMany({
    where: { businessId: business.id },
    data: { isPublished: false },
  })

  // Publish target version
  const publishedTerms = await prisma.providerTermsVersion.update({
    where: { id: termsId, businessId: business.id },
    data: {
      isPublished: true,
      publishedAt: new Date(),
    },
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'PUBLISH_PROVIDER_TERMS',
      entityType: 'PROVIDER_TERMS',
      entityId: publishedTerms.id,
      details: JSON.stringify({ version: publishedTerms.version, title: publishedTerms.title }),
    },
  })

  return NextResponse.json({ terms: publishedTerms, message: 'Terms version published successfully' })
}
