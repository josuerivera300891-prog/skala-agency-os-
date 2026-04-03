import { logger } from '@/lib/logger'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterResponse {
  choices: Array<{
    message: { content: string }
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function chatCompletion({
  messages,
  model = DEFAULT_MODEL,
  maxTokens = 400,
}: {
  messages: ChatMessage[]
  model?: string
  maxTokens?: number
}): Promise<{ text: string; tokensUsed: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured')

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL ?? 'https://skala-agency-os.vercel.app',
      'X-Title': 'Skala Agency OS',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    logger.error('[OpenRouter] API error', { status: res.status, error: err })
    throw new Error(`OpenRouter API error: ${res.status}`)
  }

  const data = (await res.json()) as OpenRouterResponse
  const text = data.choices?.[0]?.message?.content ?? ''
  const tokensUsed = data.usage?.total_tokens ?? 0

  return { text, tokensUsed }
}
