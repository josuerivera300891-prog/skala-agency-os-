import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { z } from 'zod'
import { sendWhatsApp } from '@/lib/twilio/whatsapp'
import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// Verificar token interno para llamadas service-to-service (Edge Functions)
function verifyServiceToken(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false

  const incoming = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
  if (cronSecret.length !== incoming.length) return false

  return timingSafeEqual(Buffer.from(cronSecret), Buffer.from(incoming))
}

const sendSchema = z.object({
  to:       z.string().min(1),
  clientId: z.string().uuid(),
  template: z.enum(['lead_welcome']),
  data: z.object({
    leadName:   z.string(),
    service:    z.string().optional(),
    clientName: z.string(),
  }),
})

// POST /api/whatsapp/send
// Usado por la Edge Function on-new-lead para enviar WA de bienvenida — requiere CRON_SECRET
export async function POST(req: NextRequest) {
  if (!verifyServiceToken(req)) {
    logger.warn('[WA Send] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = sendSchema.safeParse(json)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
  }

  const { to, clientId, data } = validation.data

  const supabase = createServiceClient()
  const { data: client } = await supabase
    .from('clients')
    .select('config, name')
    .eq('id', clientId)
    .single()

  if (!client?.config?.twilio_wa_number) {
    return NextResponse.json({ error: 'Cliente sin número WA configurado' }, { status: 404 })
  }

  const body = `¡Hola ${data.leadName}! 👋 Soy el asistente de ${data.clientName}. ${
    data.service
      ? `Vi que estás interesado en ${data.service}.`
      : 'Gracias por contactarnos.'
  } ¿Cuándo te vendría bien que te contactemos para más información?`

  const sent = await sendWhatsApp({
    to:   `whatsapp:${to}`,
    from: client.config.twilio_wa_number,
    body,
  })

  if (!sent) {
    logger.error('[WA Send] Falló envío de bienvenida', { clientId, to })
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sid: sent.sid })
}
