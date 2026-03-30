import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend/emails'
import { logger } from '@/lib/logger'
import type { Client } from '@/types'

// Verificar CRON_SECRET con timingSafeEqual (R8 AP-02)
function verifyCronSecret(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET!
  const incoming = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''

  if (cronSecret.length !== incoming.length) return false

  return timingSafeEqual(Buffer.from(cronSecret), Buffer.from(incoming))
}

// GET /api/cron/send-reports
// Disparado por GitHub Actions cada lunes 9am Miami
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    logger.warn('[Cron send-reports] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const results: Array<{ clientId: string; email: string }> = []
  const errors: Array<{ clientId: string; error: string }> = []

  // Traer todos los clientes activos con email de contacto
  const { data: clients, error: fetchError } = await supabase
    .from('clients')
    .select('*')
    .eq('active', true)

  if (fetchError) {
    logger.error('[Cron send-reports] Error al traer clientes', { error: fetchError.message })
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  for (const client of (clients ?? []) as Client[]) {
    if (!client.email) continue

    try {
      // Contar métricas de la última semana
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [reviewsRes, leadsRes, messagesRes] = await Promise.all([
        supabase
          .from('reviews')
          .select('id, rating', { count: 'exact' })
          .eq('client_id', client.id)
          .gte('created_at', oneWeekAgo),
        supabase
          .from('leads')
          .select('id', { count: 'exact' })
          .eq('client_id', client.id)
          .gte('created_at', oneWeekAgo),
        supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('client_id', client.id)
          .gte('created_at', oneWeekAgo),
      ])

      const sent = await sendEmail({
        to:       client.email,
        template: 'weekly_report',
        data: {
          clientName:  client.name,
          reviewCount: String(reviewsRes.count ?? 0),
          leadCount:   String(leadsRes.count ?? 0),
          messageCount: String(messagesRes.count ?? 0),
        },
      })

      if (sent) {
        results.push({ clientId: client.id, email: client.email })
      }

      // Loguear en workflow_runs
      await supabase.from('workflow_runs').insert({
        client_id: client.id,
        status:    sent ? 'success' : 'error',
        trigger:   'cron/send-reports',
        output:    {
          reviewCount:  reviewsRes.count ?? 0,
          leadCount:    leadsRes.count ?? 0,
          messageCount: messagesRes.count ?? 0,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error('[Cron send-reports] Error procesando cliente', {
        clientId: client.id,
        error: message,
      })
      errors.push({ clientId: client.id, error: message })

      await supabase.from('workflow_runs').insert({
        client_id: client.id,
        status:    'error',
        trigger:   'cron/send-reports',
        error:     message,
      })
    }
  }

  logger.info('[Cron send-reports] Completado', {
    sent: results.length,
    errors: errors.length,
  })

  return NextResponse.json({ sent: results.length, results, errors })
}
