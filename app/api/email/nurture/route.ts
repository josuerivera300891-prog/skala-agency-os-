import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend/emails'
import { logger } from '@/lib/logger'

// Verificar token interno para llamadas service-to-service (Edge Functions)
function verifyServiceToken(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false

  const incoming = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
  if (cronSecret.length !== incoming.length) return false

  return timingSafeEqual(Buffer.from(cronSecret), Buffer.from(incoming))
}

const nurtureSchema = z.object({
  leadId: z.string().uuid(),
  day:    z.number().int().min(1).max(7),
})

const DAY_TO_TEMPLATE = {
  1: 'lead_welcome',
  2: 'nurture_day_2',
  3: 'nurture_day_3',
  7: 'nurture_day_7',
} as const

// POST /api/email/nurture
// Llamado por Supabase Edge Function on-new-lead — requiere CRON_SECRET
export async function POST(req: NextRequest) {
  if (!verifyServiceToken(req)) {
    logger.warn('[Email Nurture] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = nurtureSchema.safeParse(json)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
  }

  const { leadId, day } = validation.data

  const supabase = createServiceClient()

  const { data: lead } = await supabase
    .from('leads')
    .select('*, clients(name, config, phone, agency_id)')
    .eq('id', leadId)
    .single()

  if (!lead || !lead.email) {
    return NextResponse.json({ error: 'Lead sin email' }, { status: 404 })
  }

  const templateKey = DAY_TO_TEMPLATE[day as keyof typeof DAY_TO_TEMPLATE]
  if (!templateKey) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const client = lead.clients as { name: string; config: Record<string, unknown>; phone?: string }

  const sent = await sendEmail({
    to:       lead.email,
    template: templateKey,
    data: {
      leadName:   lead.name,
      clientName: client.name,
      service:    lead.service ?? undefined,
      phone:      client.phone ?? undefined,
    },
  })

  if (sent) {
    await supabase
      .from('leads')
      .update({ nurture_day: day })
      .eq('id', leadId)
  }

  logger.info('[Email Nurture] Enviado', { leadId, day, sent })
  return NextResponse.json({ ok: true, sent })
}
