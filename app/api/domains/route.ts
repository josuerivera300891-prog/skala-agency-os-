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
  clientId: z.string().uuid(),
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

    const TLD_PRICES: Record<string, number> = {
      com: 9.77, net: 10.77, org: 10.11, io: 33.98, co: 11.50,
    }

    // Fetch agency to get domain_markup
    const { data: agency } = await auth.supabase
      .from('agencies')
      .select('domain_markup')
      .eq('id', auth.profile.agency_id)
      .single()

    const markup = agency?.domain_markup ?? 1

    // Fetch client and verify it belongs to this agency
    const { data: client } = await auth.supabase
      .from('clients')
      .select('id, wallet_balance, domain, agency_id')
      .eq('id', body.clientId)
      .eq('agency_id', auth.profile.agency_id)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Calculate final price with markup
    const tld = body.domain.split('.').pop() ?? 'com'
    const basePrice = TLD_PRICES[tld] ?? 9.77
    const finalPrice = Math.round(basePrice * markup * 100) / 100
    const walletBalance = client.wallet_balance ?? 0

    if (walletBalance < finalPrice) {
      return NextResponse.json(
        { error: 'Saldo insuficiente', required: finalPrice, balance: walletBalance },
        { status: 402 },
      )
    }

    // Register with Cloudflare
    const cfDomain = await registerDomain(body.domain, body.autoRenew ?? true)

    // Debit wallet
    const newBalance = Math.round((walletBalance - finalPrice) * 100) / 100

    const { error: updateError } = await auth.supabase
      .from('clients')
      .update({ wallet_balance: newBalance })
      .eq('id', body.clientId)

    if (updateError) {
      logger.error('[Domains] Error debiting wallet', { error: updateError.message, clientId: body.clientId })
    }

    // Record wallet transaction
    await auth.supabase
      .from('wallet_transactions')
      .insert({
        client_id: body.clientId,
        amount: -finalPrice,
        type: 'debit',
        description: `Compra dominio ${body.domain}`,
        reference_id: body.domain,
        balance_after: newBalance,
        created_by: auth.user.id,
      })

    // Set client domain if not already set
    if (!client.domain) {
      await auth.supabase
        .from('clients')
        .update({ domain: body.domain })
        .eq('id', body.clientId)
    }

    logger.info('[Domains] Domain purchased via wallet', {
      domain: body.domain,
      clientId: body.clientId,
      charged: finalPrice,
      newBalance,
    })

    return NextResponse.json({
      ok: true,
      domain: cfDomain,
      charged: finalPrice,
      newBalance,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Domains] Error processing request', { action: body.action, error: message })
    return NextResponse.json({ error: 'Request failed', detail: message }, { status: 500 })
  }
}
