import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const updateSchema = z.object({
  name:       z.string().min(1).optional(),
  legal_name: z.string().optional(),
  phone:      z.string().optional(),
  website:    z.string().optional(),
  address:    z.string().optional(),
  city:       z.string().optional(),
  state:      z.string().optional(),
  zip:        z.string().optional(),
  country:    z.string().optional(),
  timezone:   z.string().optional(),
  locale:     z.string().optional(),
})

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

// GET /api/settings — load agency data
export async function GET(req: NextRequest) {
  const auth = await getAuthClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agency } = await auth.supabase
    .from('agencies')
    .select('*')
    .eq('id', auth.profile.agency_id)
    .single()

  if (!agency) return NextResponse.json({ error: 'Agency not found' }, { status: 404 })

  return NextResponse.json({ agency })
}

// PATCH /api/settings — update agency data
export async function PATCH(req: NextRequest) {
  const auth = await getAuthClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.profile.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can update settings' }, { status: 403 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = updateSchema.safeParse(json)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
  }

  const { error } = await auth.supabase
    .from('agencies')
    .update(validation.data)
    .eq('id', auth.profile.agency_id)

  if (error) {
    logger.error('[Settings] Error updating agency', { error: error.message })
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
