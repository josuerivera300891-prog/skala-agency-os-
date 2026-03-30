import twilio from 'twilio'
import { logger } from '@/lib/logger'

function getClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  )
}

interface SendSmsParams {
  to: string
  body: string
}

export async function sendSMS({ to, body }: SendSmsParams): Promise<string | null> {
  try {
    const msg = await getClient().messages.create({
      from: process.env.TWILIO_SMS_NUMBER!,
      to,
      body,
    })
    logger.info('[Twilio SMS] Enviado', { to, sid: msg.sid })
    return msg.sid
  } catch (err) {
    logger.error('[Twilio SMS] Error', {
      to,
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}
