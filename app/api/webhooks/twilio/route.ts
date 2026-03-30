import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import twilio from 'twilio'
import { createServiceClient } from '@/lib/supabase/server'
import { generateWhatsAppReply } from '@/lib/claude/whatsapp-bot'
import { sendWhatsApp } from '@/lib/twilio/whatsapp'
import { logger } from '@/lib/logger'
import type { Client } from '@/types'

const twilioFormSchema = z.object({
  From: z.string().min(1),
  To:   z.string().min(1),
  Body: z.string().min(1),
})

// Verificar firma de Twilio para asegurar autenticidad del webhook
function verifyTwilioSignature(req: NextRequest, params: Record<string, string>): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    logger.warn('[Twilio Webhook] TWILIO_AUTH_TOKEN no configurado — firma no verificada')
    return false
  }

  const signature = req.headers.get('x-twilio-signature') ?? ''
  const url = `${process.env.APP_URL}/api/webhooks/twilio`

  return twilio.validateRequest(authToken, signature, url, params)
}

// POST /api/webhooks/twilio
// Recibe mensajes de WhatsApp entrantes desde Twilio
export async function POST(req: NextRequest) {
  let body: FormData
  try {
    body = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const formEntries = Object.fromEntries(body.entries()) as Record<string, string>

  // Validar firma de Twilio
  if (!verifyTwilioSignature(req, formEntries)) {
    logger.warn('[Twilio Webhook] Firma de Twilio inválida')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  // Validar campos requeridos con Zod
  const validation = twilioFormSchema.safeParse(formEntries)
  if (!validation.success) {
    logger.warn('[Twilio Webhook] Campos requeridos faltantes', { errors: validation.error.flatten() })
    return twimlEmpty()
  }

  const { From: from, To: to, Body: message } = validation.data

  const supabase = createServiceClient()

  // Identificar a qué cliente pertenece este número de WA
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('active', true)

  const client = (clients as Client[] ?? []).find(
    (c) => c.config.twilio_wa_number === to
  )

  if (!client) {
    logger.warn('[Twilio Webhook] Número no asociado a ningún cliente', { to })
    return twimlEmpty()
  }

  // Guardar mensaje inbound
  await supabase.from('messages').insert({
    client_id:   client.id,
    direction:   'inbound',
    channel:     'whatsapp',
    from_number: from,
    to_number:   to,
    body:        message,
  })

  // Generar respuesta con Claude
  let reply: { text: string; intent: 'appointment' | 'inquiry' | 'complaint' | 'other'; detectedService?: string } = {
    text: 'Gracias por tu mensaje. Te contactamos pronto.',
    intent: 'other',
  }
  try {
    reply = await generateWhatsAppReply({
      message,
      clientName: client.name,
      vertical:   client.vertical,
      config:     client.config,
    })
  } catch (err) {
    logger.error('[Twilio Webhook] Error generando respuesta Claude', {
      clientId: client.id,
      error: err instanceof Error ? err.message : String(err),
    })
  }

  // Enviar respuesta por WA
  const sent = await sendWhatsApp({ to: from, from: to, body: reply.text })

  // Guardar mensaje outbound
  await supabase.from('messages').insert({
    client_id:   client.id,
    direction:   'outbound',
    channel:     'whatsapp',
    from_number: to,
    to_number:   from,
    body:        reply.text,
    status:      sent ? 'sent' : 'failed',
    twilio_sid:  sent?.sid,
  })

  // Si Claude detectó intención de cita o consulta → crear lead
  if (reply.intent === 'appointment' || reply.intent === 'inquiry') {
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('client_id', client.id)
      .eq('phone', from.replace('whatsapp:', ''))
      .maybeSingle()

    if (!existingLead) {
      await supabase.from('leads').insert({
        client_id: client.id,
        name:      from.replace('whatsapp:', ''), // se actualizará cuando den su nombre
        phone:     from.replace('whatsapp:', ''),
        service:   reply.detectedService ?? undefined,
        source:    'whatsapp',
        status:    'contacted',
        metadata:  { first_message: message, intent: reply.intent },
      })
      logger.info('[Twilio Webhook] Lead creado desde WA', { clientId: client.id, intent: reply.intent })
    }
  }

  return twimlEmpty()
}

function twimlEmpty() {
  return new NextResponse('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  })
}
