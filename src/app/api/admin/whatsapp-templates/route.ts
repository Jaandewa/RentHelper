import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { seedDefaultTemplates } from '@/lib/notifications/template-renderer'
import { EVENT_VARIABLES, type WhatsAppEventType } from '@/lib/notifications/template-defaults'

/**
 * Transforms raw DB variables (JSON string of names) into
 * the { name, description }[] shape the admin UI expects.
 */
function transformVariables(eventType: string, rawVariables: string | null) {
  // Build from EVENT_VARIABLES — authoritative source of allowed vars + auto-descriptions
  const allowedVars = EVENT_VARIABLES[eventType as WhatsAppEventType]
  if (allowedVars) {
    return allowedVars.map(name => ({
      name,
      description: formatVarDescription(name),
    }))
  }

  // Fallback: try parsing the stored JSON string
  if (rawVariables) {
    try {
      const parsed = JSON.parse(rawVariables)
      if (Array.isArray(parsed)) {
        return parsed.map((v: string) => ({
          name: typeof v === 'string' ? v : String(v),
          description: formatVarDescription(typeof v === 'string' ? v : String(v)),
        }))
      }
    } catch { /* ignore parse errors */ }
  }

  return []
}

/** Generates a human-readable description from a camelCase variable name */
function formatVarDescription(name: string): string {
  // camelCase → words
  const words = name.replace(/([A-Z])/g, ' $1').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Auto-seed missing defaults
    await seedDefaultTemplates()

    const rawTemplates = await prisma.whatsAppTemplate.findMany({
      orderBy: { eventType: 'asc' },
    })

    // Transform each template's variables from JSON string → array of objects
    const templates = rawTemplates.map(t => ({
      ...t,
      variables: transformVariables(t.eventType, t.variables),
    }))

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('[WhatsApp Templates API] List error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
