import { chatCompletion } from '@/lib/ai/openrouter'
import { logger } from '@/lib/logger'

interface ReviewReplyParams {
  reviewText: string
  rating: number
  reviewerName: string
  clientName: string
  vertical: string
}

export async function generateReviewReply(params: ReviewReplyParams): Promise<string> {
  const { reviewText, rating, reviewerName, clientName, vertical } = params

  const prompt =
    rating >= 4
      ? `Eres el community manager de ${clientName}, un negocio de ${vertical} en Miami.
Genera una respuesta BREVE (máx 3 oraciones), cálida y auténtica en español para esta reseña positiva de ${reviewerName} (${rating} estrellas): "${reviewText}"
- No uses emojis en exceso (máximo 1)
- Menciona el nombre del cliente
- Invítalos a volver
- Suena humano, no corporativo
Solo devuelve el texto de la respuesta, sin comillas ni explicaciones.`
      : `Eres el community manager de ${clientName}, un negocio de ${vertical} en Miami.
Genera una respuesta EMPÁTICA en español para esta reseña negativa de ${reviewerName} (${rating} estrellas): "${reviewText}"
- Agradece el feedback
- Pide disculpas sin admitir culpa excesiva
- Ofrece resolver el problema (contacto directo)
- Máximo 3 oraciones
Solo devuelve el texto de la respuesta.`

  const { text, tokensUsed } = await chatCompletion({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 300,
  })

  logger.info('[AI] Respuesta de reseña generada', {
    clientName,
    rating,
    tokensUsed,
  })

  return text
}
