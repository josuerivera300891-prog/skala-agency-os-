import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { listLocations, type GHLLocation } from '@/lib/ghl/api'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const migrateSchema = z.object({
  ghlApiKey: z.string().min(1, 'API key is required'),
})

// ---------------------------------------------------------------------------
// Auth helper (same pattern as settings/route.ts)
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

// ---------------------------------------------------------------------------
// POST /api/migrate/ghl — import GHL locations as Skala clients
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 1. Auth
  const auth = await getAuthClient(req)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (auth.profile.role !== 'owner') {
    return NextResponse.json({ error: 'Only agency owners can run migrations' }, { status: 403 })
  }

  // 2. Validate input
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = migrateSchema.safeParse(json)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
  }

  const { ghlApiKey } = validation.data
  const agencyId = auth.profile.agency_id

  try {
    // 3. Fetch locations from GHL
    const locations = await listLocations(ghlApiKey)

    if (locations.length === 0) {
      return NextResponse.json({ imported: 0, skipped: 0, locations: [], message: 'No locations found in GHL' })
    }

    // 4. Get existing clients to check for duplicates (match by name + phone)
    const { data: existingClients } = await auth.supabase
      .from('clients')
      .select('name, phone')
      .eq('agency_id', agencyId)

    const existingSet = new Set(
      (existingClients ?? []).map((c: { name: string; phone: string | null }) =>
        `${(c.name || '').toLowerCase()}||${(c.phone || '').toLowerCase()}`
      )
    )

    // 5. Process each location
    let imported = 0
    let skipped = 0
    const results: Array<{ name: string; status: 'imported' | 'skipped'; ghl_id: string }> = []

    for (const loc of locations) {
      const clientName = loc.business?.name as string || loc.name
      const clientPhone = loc.phone || ''
      const key = `${clientName.toLowerCase()}||${clientPhone.toLowerCase()}`

      // Skip if already exists
      if (existingSet.has(key)) {
        skipped++
        results.push({ name: clientName, status: 'skipped', ghl_id: loc.id })
        logger.info('[Migration] Skipped duplicate', { name: clientName, ghlId: loc.id })
        continue
      }

      const { error } = await auth.supabase.from('clients').insert({
        agency_id: agencyId,
        name: clientName,
        vertical: 'otro',
        email: loc.email || null,
        phone: loc.phone || null,
        domain: loc.website || null,
        active: true,
        config: {
          address: loc.address || null,
          city: loc.city || null,
          state: loc.state || null,
          zip: loc.postalCode || null,
          ghl_location_id: loc.id,
        },
      })

      if (error) {
        logger.error('[Migration] Insert error', { error: error.message, name: clientName, ghlId: loc.id })
        // Continue with remaining locations instead of failing entirely
        results.push({ name: clientName, status: 'skipped', ghl_id: loc.id })
        skipped++
        continue
      }

      imported++
      existingSet.add(key)
      results.push({ name: clientName, status: 'imported', ghl_id: loc.id })
      logger.info('[Migration] Client imported', { name: clientName, ghlId: loc.id })
    }

    logger.info('[Migration] GHL import complete', { imported, skipped, total: locations.length })

    return NextResponse.json({ imported, skipped, locations: results })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Migration] GHL migration failed', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
