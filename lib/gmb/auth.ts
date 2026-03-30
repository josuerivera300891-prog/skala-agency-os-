import { google } from 'googleapis'
import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { Client } from '@/types'

const SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
  'https://www.googleapis.com/auth/userinfo.email',
]

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  )
}

export function getAuthUrl(clientId: string): string {
  const oauth2 = getOAuth2Client()
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // forzar para obtener refresh_token siempre
    state: clientId,   // pasamos el client_id para recuperarlo en callback
  })
}

// Retorna un access_token válido, refrescándolo si está vencido
export async function getValidToken(client: Client): Promise<string> {
  const { gmb_access_token, gmb_refresh_token, gmb_token_expiry } = client.config

  if (!gmb_refresh_token) {
    throw new Error(`Cliente ${client.id} no tiene GMB conectado`)
  }

  const expiry = gmb_token_expiry ? new Date(gmb_token_expiry) : new Date(0)
  const isExpired = expiry <= new Date(Date.now() + 60_000) // margen de 1 min

  if (gmb_access_token && !isExpired) {
    return gmb_access_token
  }

  // Token expirado — refrescar
  logger.info('[GMB Auth] Refrescando token', { clientId: client.id })

  const oauth2 = getOAuth2Client()
  oauth2.setCredentials({ refresh_token: gmb_refresh_token })

  const { credentials } = await oauth2.refreshAccessToken()

  if (!credentials.access_token) {
    throw new Error(`No se pudo refrescar token para cliente ${client.id}`)
  }

  const supabase = createServiceClient()
  await supabase
    .from('clients')
    .update({
      config: {
        ...client.config,
        gmb_access_token: credentials.access_token,
        gmb_token_expiry: credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : new Date(Date.now() + 3600_000).toISOString(),
      },
    })
    .eq('id', client.id)

  logger.info('[GMB Auth] Token refrescado', { clientId: client.id })
  return credentials.access_token
}
