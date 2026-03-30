import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'
import type { WhatsAppReplyResult, ClientConfig } from '@/types'

const client = new Anthropic()

interface WhatsAppBotParams {
  message:    string
  clientName: string
  vertical:   string
  config:     ClientConfig
}

export async function generateWhatsAppReply(params: WhatsAppBotParams): Promise<WhatsAppReplyResult> {
  const { message, clientName, vertical, config } = params

  const systemPrompt = `Eres el asistente virtual de ${clientName}, un negocio de ${vertical} en Miami.
Tu trabajo es responder mensajes de WhatsApp de manera amigable, concisa y útil en español.

Servicios que ofrecemos: ${config.services?.join(', ') || 'consultar disponibilidad'}
Horario: ${config.hours || 'Lun-Sáb 9am-6pm'}
Teléfono para citas: ${config.phone || 'nuestro WhatsApp'}

Reglas:
- Respuestas máximo 3 oraciones
- Si piden precio, da rango aproximado y ofrece consulta
- Si quieren cita, pide: nombre completo, servicio y día/hora preferida
- Si es queja, empatiza y ofrece solución
- Siempre termina con una CTA clara

Responde SOLO con JSON válido (sin markdown, sin backticks):
{"text":"respuesta aquí","intent":"appointment|inquiry|complaint|other","detectedService":"servicio si aplica o null"}`

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 400,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: message }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'

  logger.info('[Claude WA Bot] Respuesta generada', {
    clientName,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  })

  try {
    const parsed = JSON.parse(raw) as WhatsAppReplyResult
    return parsed
  } catch {
    logger.warn('[Claude WA Bot] JSON inválido, retornando texto crudo', { raw })
    return { text: raw, intent: 'other' }
  }
}
