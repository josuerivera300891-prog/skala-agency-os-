import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { logger } from '@/lib/logger'

async function getAuthClient(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id) return null
  return { supabase, user, profile }
}

// GET /api/settings/integrations — check connection status of external services
export async function GET(req: NextRequest) {
  const auth = await getAuthClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if any client in the agency has a GMB refresh token configured
  let google = false
  try {
    const { data: clients } = await auth.supabase
      .from('clients')
      .select('id, config')
      .eq('agency_id', auth.profile.agency_id)

    if (clients && clients.length > 0) {
      google = clients.some(
        (c: { config: Record<string, unknown> | null }) =>
          c.config && typeof c.config === 'object' && c.config.gmb_refresh_token != null
      )
    }
  } catch (error) {
    logger.error('[Settings/Integrations] Error checking Google status', { error })
  }

  return NextResponse.json({
    google,
    ai: !!process.env.OPENROUTER_API_KEY,
    twilio: !!process.env.TWILIO_ACCOUNT_SID,
    resend: !!process.env.RESEND_API_KEY,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    supabase: true,
  })
}
