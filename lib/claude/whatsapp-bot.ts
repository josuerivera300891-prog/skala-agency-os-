import { chatCompletion } from '@/lib/ai/openrouter'
import { logger } from '@/lib/logger'
import type { WhatsAppReplyResult, ClientConfig } from '@/types'

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

  const { text: raw, tokensUsed } = await chatCompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ],
    maxTokens: 400,
  })

  logger.info('[AI WA Bot] Respuesta generada', {
    clientName,
    tokensUsed,
  })

  try {
    const parsed = JSON.parse(raw) as WhatsAppReplyResult
    return parsed
  } catch {
    logger.warn('[AI WA Bot] JSON inválido, retornando texto crudo', { raw })
    return { text: raw, intent: 'other' }
  }
}
