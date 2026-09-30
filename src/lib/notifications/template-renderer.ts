/**
 * WhatsApp Template Renderer
 * 
 * Central engine for loading, validating, and rendering WhatsApp message templates.
 * All WhatsApp event messages route through renderWhatsAppTemplate().
 */

import prisma from '@/lib/prisma'
import {
  EVENT_VARIABLES,
  DEFAULT_TEMPLATES,
  WHATSAPP_EVENT_TYPES,
  type WhatsAppEventType,
} from './template-defaults'

/**
 * Validates that a template body only contains supported variables for the event type.
 * Returns list of unsupported variable names found.
 */
export function validateTemplateVariables(
  eventType: WhatsAppEventType,
  messageBody: string
): string[] {
  const allowedVars = EVENT_VARIABLES[eventType] || []
  const usedVars = messageBody.match(/\{(\w+)\}/g)?.map(v => v.slice(1, -1)) || []
  return usedVars.filter(v => !allowedVars.includes(v))
}

/**
 * Replaces {variableName} placeholders with actual values.
 * Unknown/missing variables are replaced with 'N/A'.
 * Never outputs 'undefined', 'null', or '[object Object]'.
 */
function replaceVariables(
  template: string,
  variables: Record<string, string | number | undefined | null>
): string {
  return template.replace(/\{(\w+)\}/g, (match, varName) => {
    const value = variables[varName]
    if (value === undefined || value === null || value === '') return 'N/A'
    const str = String(value)
    // Guard against object serialization
    if (str === '[object Object]') return 'N/A'
    return str
  })
}

/**
 * Sanitizes user-provided variable values to prevent injection.
 * Strips HTML tags and limits length.
 */
function sanitizeVariableValue(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return ''
  const str = String(value)
  // Strip HTML tags
  return str.replace(/<[^>]*>/g, '').slice(0, 1000)
}

/**
 * Gets the fallback message for an event type from hardcoded defaults.
 */
function getFallbackMessage(eventType: string): string {
  const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.eventType === eventType)
  return defaultTemplate?.messageBody || `Notification: ${eventType}`
}

/**
 * Central template renderer.
 * 
 * 1. Loads enabled DB template for the event
 * 2. Falls back to hardcoded default if missing/disabled
 * 3. Replaces {variable} placeholders with sanitized values
 * 4. Returns rendered plain text ready for sendWhatsAppText()
 * 
 * NEVER throws — returns a safe message on any failure.
 */
export async function renderWhatsAppTemplate(
  eventType: string,
  variables: Record<string, string | number | undefined | null>
): Promise<{
  message: string
  usedTemplate: boolean
  templateId?: string
  skipped?: boolean
}> {
  // Sanitize all variable values
  const sanitized: Record<string, string> = {}
  for (const [key, value] of Object.entries(variables)) {
    sanitized[key] = sanitizeVariableValue(value)
  }

  try {
    // Load template from DB
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { eventType },
    })

    if (template) {
      // Template disabled — skip WhatsApp (in-app still works)
      if (!template.isEnabled) {
        return { message: '', usedTemplate: true, templateId: template.id, skipped: true }
      }

      // Render with DB template
      const message = replaceVariables(template.messageBody, sanitized)
      return { message, usedTemplate: true, templateId: template.id }
    }

    // No template in DB — use fallback and warn
    console.warn(`[Template Renderer] No DB template for event "${eventType}", using default`)
    const fallback = getFallbackMessage(eventType)
    const message = replaceVariables(fallback, sanitized)
    return { message, usedTemplate: false }
  } catch (error) {
    // DB failure — never block business logic, use fallback
    console.error(`[Template Renderer] DB error for "${eventType}":`, error)
    const fallback = getFallbackMessage(eventType)
    const message = replaceVariables(fallback, sanitized)
    return { message, usedTemplate: false }
  }
}

/**
 * Preview a template with mock values.
 * Used by admin preview endpoint — never sends a real message.
 */
export function previewTemplate(
  messageBody: string,
  eventType: WhatsAppEventType,
  previewValues: Record<string, string>
): { rendered: string; unsupportedVars: string[] } {
  const unsupportedVars = validateTemplateVariables(eventType, messageBody)
  const rendered = replaceVariables(messageBody, previewValues)
  return { rendered, unsupportedVars }
}

/**
 * Seeds default templates into the database.
 * Only creates templates that don't already exist (upsert by eventType).
 */
export async function seedDefaultTemplates(): Promise<number> {
  let created = 0
  for (const template of DEFAULT_TEMPLATES) {
    const existing = await prisma.whatsAppTemplate.findUnique({
      where: { eventType: template.eventType },
    })
    if (!existing) {
      await prisma.whatsAppTemplate.create({
        data: {
          eventType: template.eventType,
          name: template.name,
          description: template.description,
          messageBody: template.messageBody,
          variables: JSON.stringify(EVENT_VARIABLES[template.eventType]),
          isEnabled: true,
        },
      })
      created++
    }
  }
  return created
}

/** Check if an event type is valid */
export function isValidEventType(eventType: string): eventType is WhatsAppEventType {
  return (WHATSAPP_EVENT_TYPES as readonly string[]).includes(eventType)
}
