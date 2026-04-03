import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { searchDomains, registerDomain, listDomains } from '@/lib/cloudflare/domains'

// ---------------------------------------------------------------------------
// Auth helper (same pattern as /api/settings)
// ---------------------------------------------------------------------------

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
    },
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

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const searchSchema = z.object({
  action: z.literal('search'),
  query: z.string().min(1).max(63),
})

const registerSchema = z.object({
  action: z.literal('register'),
  domain: z.string().min(3).max(253),
  autoRenew: z.boolean().optional().default(true),
})

const postSchema = z.discriminatedUnion('action', [searchSchema, registerSchema])

// ---------------------------------------------------------------------------
// GET /api/domains — list all registered domains
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const auth = await getAuthClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const domains = await listDomains()
    return NextResponse.json({ domains })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Domains] Error listing domains', { error: message })
    return NextResponse.json({ error: 'Failed to list domains' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/domains — search or register
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const auth = await getAuthClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = postSchema.safeParse(json)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.flatten() },
      { status: 400 },
    )
  }

  const body = validation.data

  try {
    if (body.action === 'search') {
      const results = await searchDomains(body.query)
      return NextResponse.json({ results })
    }

    // Register — only agency owners can purchase domains
    if (auth.profile.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only agency owners can register domains' },
        { status: 403 },
      )
    }

    const domain = await registerDomain(body.domain, body.autoRenew)
    return NextResponse.json({ domain })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Domains] Error processing request', { action: body.action, error: message })
    return NextResponse.json({ error: 'Request failed', detail: message }, { status: 500 })
  }
}
