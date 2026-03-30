import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchNewReviews, replyToReview } from '@/lib/gmb/reviews'
import { generateReviewReply } from '@/lib/claude/review-reply'
import { getValidToken } from '@/lib/gmb/auth'
import { sendSMS } from '@/lib/twilio/sms'
import { logger } from '@/lib/logger'
import type { Client } from '@/types'

// Verificar CRON_SECRET con timingSafeEqual (R8 AP-02)
function verifyCronSecret(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET!
  const incoming = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''

  if (cronSecret.length !== incoming.length) return false

  const { timingSafeEqual } = require('crypto')
  return timingSafeEqual(Buffer.from(cronSecret), Buffer.from(incoming))
}

// GET /api/cron/fetch-reviews
// Disparado por GitHub Actions cada 5 minutos
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    logger.warn('[Cron fetch-reviews] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const results: Array<{ clientId: string; reviewId: string; rating: number }> = []
  const errors: Array<{ clientId: string; error: string }> = []

  // Traer todos los clientes activos con GMB configurado
  const { data: clients, error: fetchError } = await supabase
    .from('clients')
    .select('*')
    .eq('active', true)
    .not('gmb_location_id', 'is', null)
    .not('gmb_account_id', 'is', null)

  if (fetchError) {
    logger.error('[Cron fetch-reviews] Error al traer clientes', { error: fetchError.message })
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  for (const client of (clients ?? []) as Client[]) {
    try {
      // 1. Obtener token válido (refresca si expiró)
      const accessToken = await getValidToken(client)

      // 2. Traer reseñas nuevas sin respuesta
      const reviews = await fetchNewReviews(
        client.gmb_account_id!,
        client.gmb_location_id!,
        accessToken
      )

      for (const review of reviews) {
        // 3. Verificar que no fue ya procesada
        const { data: existing } = await supabase
          .from('reviews')
          .select('id')
          .eq('gmb_review_id', review.reviewId)
          .single()

        if (existing) continue

        // 4. Generar respuesta con Claude
        const replyText = await generateReviewReply({
          reviewText:   review.comment ?? '(sin texto)',
          rating:       review.starRating,
          reviewerName: review.reviewer.displayName,
          clientName:   client.name,
          vertical:     client.vertical,
        })

        // 5. Publicar respuesta en Google
        const published = await replyToReview(
          client.gmb_account_id!,
          client.gmb_location_id!,
          review.reviewId,
          replyText,
          accessToken
        )

        // 6. Guardar en BD
        await supabase.from('reviews').insert({
          client_id:          client.id,
          gmb_review_id:      review.reviewId,
          author:             review.reviewer.displayName,
          rating:             review.starRating,
          text:               review.comment,
          reply:              replyText,
          reply_generated_at: new Date().toISOString(),
          reply_published_at: published ? new Date().toISOString() : null,
        })

        // 7. Loguear en workflow_runs
        await supabase.from('workflow_runs').insert({
          client_id: client.id,
          status:    published ? 'success' : 'error',
          trigger:   'cron/fetch-reviews',
          output:    { reviewId: review.reviewId, rating: review.starRating, published },
        })

        // 8. Si rating <= 3: alertar al dueño por SMS
        if (review.starRating <= 3 && client.config.owner_phone) {
          await sendSMS({
            to:   client.config.owner_phone,
            body: `⚠️ Reseña ${review.starRating}★ en ${client.name}: "${review.comment?.slice(0, 100)}..." — Ya fue respondida automáticamente.`,
          })

          await supabase
            .from('reviews')
            .update({ alert_sent: true })
            .eq('gmb_review_id', review.reviewId)
        }

        results.push({ clientId: client.id, reviewId: review.reviewId, rating: review.starRating })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error('[Cron fetch-reviews] Error procesando cliente', {
        clientId: client.id,
        error: message,
      })
      errors.push({ clientId: client.id, error: message })

      await supabase.from('workflow_runs').insert({
        client_id: client.id,
        status:    'error',
        trigger:   'cron/fetch-reviews',
        error:     message,
      })
    }
  }

  logger.info('[Cron fetch-reviews] Completado', {
    processed: results.length,
    errors: errors.length,
  })

  return NextResponse.json({ processed: results.length, results, errors })
}
