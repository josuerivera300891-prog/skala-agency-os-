import { getOAuth2Client } from './auth'
import { logger } from '@/lib/logger'

export interface GmbReview {
  reviewId: string
  reviewer: { displayName: string }
  starRating: 1 | 2 | 3 | 4 | 5
  comment?: string
  createTime: string
  updateTime: string
  reviewReply?: { comment: string; updateTime: string }
}

interface GmbReviewsListResponse {
  reviews?: GmbReview[]
  nextPageToken?: string
}

// Trae reseñas sin respuesta de los últimos 7 días
export async function fetchNewReviews(
  accountId: string,
  locationId: string,
  accessToken: string
): Promise<GmbReview[]> {
  try {
    const auth = getOAuth2Client()
    auth.setCredentials({ access_token: accessToken })

    const parent = `accounts/${accountId}/locations/${locationId}`
    const url = `https://mybusiness.googleapis.com/v4/${parent}/reviews?pageSize=50`

    const token = await auth.getAccessToken()
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token.token}` },
    })

    if (!res.ok) {
      throw new Error(`GMB API ${res.status}: ${await res.text()}`)
    }

    const data = await res.json() as GmbReviewsListResponse
    const reviews = data.reviews ?? []
    const cutoff = new Date(Date.now() - 7 * 24 * 3600_000)

    return reviews.filter(
      (r) => !r.reviewReply && new Date(r.createTime) >= cutoff
    )
  } catch (err) {
    logger.error('[GMB Reviews] Error al traer reseñas', {
      accountId,
      locationId,
      error: err instanceof Error ? err.message : String(err),
    })
    return []
  }
}

// Publica respuesta a una reseña en Google
export async function replyToReview(
  accountId: string,
  locationId: string,
  reviewId: string,
  replyText: string,
  accessToken: string
): Promise<boolean> {
  try {
    const auth = getOAuth2Client()
    auth.setCredentials({ access_token: accessToken })

    const name = `accounts/${accountId}/locations/${locationId}/reviews/${reviewId}`
    const url = `https://mybusiness.googleapis.com/v4/${name}/reply`

    const token = await auth.getAccessToken()
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: replyText }),
    })

    if (!res.ok) {
      throw new Error(`GMB API ${res.status}: ${await res.text()}`)
    }

    logger.info('[GMB Reviews] Respuesta publicada', { reviewId })
    return true
  } catch (err) {
    logger.error('[GMB Reviews] Error al publicar respuesta', {
      reviewId,
      error: err instanceof Error ? err.message : String(err),
    })
    return false
  }
}
