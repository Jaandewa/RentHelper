import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
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
        // Validate MIME type
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

        // Read file content and create a fresh Blob to ensure clean transfer
        const buffer = await file.arrayBuffer()
        const blob = new Blob([buffer], { type: file.type })
        outgoingForm.append('images[]', blob, file.name)
      }
    }

    // Forward to the external PHP image server
    const response = await fetch('https://uploads.healingcity.lk/index.php', {
      method: 'POST',
      body: outgoingForm,
    })

    const responseText = await response.text()
    console.log('PHP server response:', response.status, responseText)

    // Try to parse JSON, but handle non-JSON responses gracefully
    try {
      const data = JSON.parse(responseText)
      return NextResponse.json(data, { status: response.status })
    } catch {
      return NextResponse.json(
        { message: `PHP server error (${response.status}): ${responseText.substring(0, 200)}` },
        { status: response.status || 500 }
      )
    }
  } catch (error: any) {
    console.error('Upload proxy error:', error)
    return NextResponse.json(
      { message: `Upload proxy error: ${error.message}` },
      { status: 500 }
    )
  }
}
