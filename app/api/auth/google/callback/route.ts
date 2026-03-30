import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@supabase/ssr'
import { getOAuth2Client } from '@/lib/gmb/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

const callbackSchema = z.object({
  code:  z.string().min(1),
  state: z.string().uuid(), // clientId pasado en state
})

// GET /api/auth/google/callback?code=...&state=<clientId>
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams)
  const validation = callbackSchema.safeParse(params)

  if (!validation.success) {
    logger.warn('[Google OAuth] Callback con params inválidos', { params })
    return NextResponse.redirect(new URL('/dashboard?error=oauth_invalid', req.url))
  }

  const { code, state: clientId } = validation.data

  try {
    // Verificar que el usuario autenticado tiene acceso a este cliente
    const res = NextResponse.next()
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const { data: profile } = await authClient
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.redirect(new URL('/dashboard?error=no_agency', req.url))
    }

    const oauth2 = getOAuth2Client()
    const { tokens } = await oauth2.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Google no retornó tokens completos')
    }

    const supabase = createServiceClient()

    // Traer config actual del cliente verificando que pertenece a la agencia del usuario
    const { data: client, error } = await supabase
      .from('clients')
      .select('config')
      .eq('id', clientId)
      .eq('agency_id', profile.agency_id)
      .single()

    if (error || !client) {
      throw new Error(`Cliente ${clientId} no encontrado`)
    }

    await supabase
      .from('clients')
      .update({
        config: {
          ...client.config,
          gmb_access_token:  tokens.access_token,
          gmb_refresh_token: tokens.refresh_token,
          gmb_token_expiry:  tokens.expiry_date
            ? new Date(tokens.expiry_date).toISOString()
            : new Date(Date.now() + 3600_000).toISOString(),
        },
      })
      .eq('id', clientId)

    logger.info('[Google OAuth] Tokens guardados', { clientId })
    return NextResponse.redirect(new URL(`/clients/${clientId}?gmb=connected`, req.url))
  } catch (err) {
    logger.error('[Google OAuth] Error en callback', {
      error: err instanceof Error ? err.message : String(err),
      clientId,
    })
    return NextResponse.redirect(new URL('/dashboard?error=oauth_failed', req.url))
  }
}
