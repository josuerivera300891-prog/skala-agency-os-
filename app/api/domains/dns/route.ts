import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { listDnsRecords, addDnsRecord } from '@/lib/cloudflare/domains'

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

const dnsRecordSchema = z.object({
  zoneId: z.string().min(1),
  type: z.string().min(1).max(10),
  name: z.string().min(1).max(253),
  content: z.string().min(1),
  proxied: z.boolean().optional().default(false),
  ttl: z.number().int().positive().optional(),
})

// ---------------------------------------------------------------------------
// GET /api/domains/dns?zoneId=xxx — list DNS records for a zone
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const auth = await getAuthClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const zoneId = req.nextUrl.searchParams.get('zoneId')
  if (!zoneId) {
    return NextResponse.json({ error: 'Missing zoneId query parameter' }, { status: 400 })
  }

  try {
    const records = await listDnsRecords(zoneId)
    return NextResponse.json({ records })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[DNS] Error listing records', { zoneId, error: message })
    return NextResponse.json({ error: 'Failed to list DNS records' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/domains/dns — add a DNS record
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

  const validation = dnsRecordSchema.safeParse(json)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.flatten() },
      { status: 400 },
    )
  }

  const { zoneId, type, name, content, proxied, ttl } = validation.data

  try {
    const record = await addDnsRecord(zoneId, { type, name, content, proxied, ttl })
    return NextResponse.json({ record })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[DNS] Error adding record', { zoneId, type, name, error: message })
    return NextResponse.json({ error: 'Failed to add DNS record', detail: message }, { status: 500 })
  }
}
