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

    for (const file of files) {
      if (file instanceof File) {
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
