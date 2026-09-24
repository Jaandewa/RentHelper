import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    
    // Forward the FormData to the external image server
    const response = await fetch('https://uploads.healingcity.lk/index.php', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('PHP Server Error:', response.status, errorText)
      return NextResponse.json({ message: `External server error: ${response.status} - ${errorText.substring(0, 100)}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ message: `Error uploading image: ${error.message}` }, { status: 500 })
  }
}
