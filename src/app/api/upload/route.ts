import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

function validateMagicBytes(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer)
  if (bytes.length < 4) return false

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return true
  }

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return true
  }

  // PDF: %PDF (25 50 44 46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return true
  }

  // WebP: RIFF (52 49 46 46) ... WEBP at offset 8 (57 45 42 50)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return true
  }

  // HEIC / HEIF: 'ftyp' at offset 4 (66 74 79 70)
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
  ) {
    return true
  }

  return false
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const incomingForm = await req.formData()
    
    // Reconstruct FormData properly for the PHP server
    const outgoingForm = new FormData()
    const files = incomingForm.getAll('images[]')
    
    if (files.length === 0) {
      return NextResponse.json({ message: 'No files provided' }, { status: 400 })
    }

    const ALLOWED_MIME_TYPES = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'application/pdf',
    ]
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB
    const MAX_PDF_SIZE = 20 * 1024 * 1024 // 20 MB

    for (const file of files) {
      if (file instanceof File) {
        // Validate MIME type & Extension
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        const isAllowedType = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) || isPdf || /\.(jpe?g|png|webp|heic|heif|pdf)$/i.test(file.name)
        
        if (!isAllowedType) {
          return NextResponse.json({ success: false, error: `File type '${file.type || file.name}' is not supported.` }, { status: 400 })
        }

        // Validate server file size limits
        if (isPdf) {
          if (file.size > MAX_PDF_SIZE) {
            return NextResponse.json({ success: false, error: 'The uploaded PDF exceeds the 20 MB limit.' }, { status: 400 })
          }
        } else if (file.size > MAX_IMAGE_SIZE) {
          return NextResponse.json({ success: false, error: 'The uploaded image exceeds the 10 MB server limit. Please try again.' }, { status: 400 })
        }

        // Read file content and validate binary magic bytes / file signature
        const buffer = await file.arrayBuffer()
        if (!validateMagicBytes(buffer)) {
          return NextResponse.json({ success: false, error: 'Invalid file signature or corrupted document header.' }, { status: 400 })
        }

        const blob = new Blob([buffer], { type: file.type })
        outgoingForm.append('images[]', blob, file.name)
      }
    }

    const storageSecret = process.env.STORAGE_SERVER_API_KEY || process.env.CRON_SECRET || ''

    // Forward to external PHP storage server with server-to-server authorization header
    const response = await fetch('https://uploads.healingcity.lk/index.php', {
      method: 'POST',
      headers: {
        'X-Storage-Api-Key': storageSecret,
      },
      body: outgoingForm,
    })

    const responseText = await response.text()

    // Try to parse JSON response safely without logging sensitive metadata
    try {
      const data = JSON.parse(responseText)
      return NextResponse.json(data, { status: response.status })
    } catch {
      return NextResponse.json(
        { message: `Storage server error (${response.status})` },
        { status: response.status || 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Upload proxy error' },
      { status: 500 }
    )
  }
}
