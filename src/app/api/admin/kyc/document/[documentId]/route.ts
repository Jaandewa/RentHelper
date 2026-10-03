import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { documentId } = await params
    if (!documentId) {
      return NextResponse.json({ message: 'Document ID required' }, { status: 400 })
    }

    const doc = await prisma.customerDocument.findUnique({
      where: { id: documentId },
    })

    if (!doc) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 })
    }

    // Extract storage key from stored reference (handling legacy full URLs if present)
    const storageKey = doc.url.includes('/') ? doc.url.split('/').pop()! : doc.url

    const storageSecret = process.env.STORAGE_SERVER_API_KEY || process.env.CRON_SECRET || ''

    const fetchUrl = `https://uploads.healingcity.lk/index.php?action=fetch&key=${encodeURIComponent(storageKey)}`
    
    const remoteRes = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'X-Storage-Api-Key': storageSecret,
      },
      cache: 'no-store',
    })

    if (!remoteRes.ok) {
      return NextResponse.json({ message: 'Unable to retrieve document binary' }, { status: remoteRes.status })
    }

    const arrayBuffer = await remoteRes.arrayBuffer()
    const lowerKey = storageKey.toLowerCase()

    let contentType = 'application/octet-stream'
    if (lowerKey.endsWith('.jpg') || lowerKey.endsWith('.jpeg')) {
      contentType = 'image/jpeg'
    } else if (lowerKey.endsWith('.png')) {
      contentType = 'image/png'
    } else if (lowerKey.endsWith('.webp')) {
      contentType = 'image/webp'
    } else if (lowerKey.endsWith('.pdf')) {
      contentType = 'application/pdf'
    }

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${doc.type}_${doc.fileName || 'document'}"`,
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
      },
    })
  } catch (err: any) {
    console.error('Admin KYC document stream error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
