import twilio from 'twilio'
import { logger } from '@/lib/logger'

function getClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  )
}

interface SendWhatsAppParams {
  to: string   // formato: whatsapp:+1305XXXXXXX
  from: string // número Twilio: whatsapp:+1XXXXXXXXXX
  body: string
}

export async function sendWhatsApp({ to, from, body }: SendWhatsAppParams): Promise<{ sid: string } | null> {
  try {
    const msg = await getClient().messages.create({ from, to, body })
    logger.info('[Twilio WA] Mensaje enviado', { to, sid: msg.sid })
    return { sid: msg.sid }
  } catch (err) {
    logger.error('[Twilio WA] Error al enviar', {
      to,
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}
