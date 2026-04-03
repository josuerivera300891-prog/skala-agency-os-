import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const creditSchema = z.object({
  clientId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().min(1),
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

// GET /api/wallet?clientId=xxx — Returns balance and last 20 transactions
export async function GET(req: NextRequest) {
  const auth = await getAuthClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = req.nextUrl.searchParams.get('clientId')
  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
  }

  // Verify client belongs to user's agency
  const { data: client } = await auth.supabase
    .from('clients')
    .select('id, wallet_balance, agency_id')
    .eq('id', clientId)
    .eq('agency_id', auth.profile.agency_id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const { data: transactions } = await auth.supabase
    .from('wallet_transactions')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({
    balance: client.wallet_balance ?? 0,
    transactions: transactions ?? [],
  })
}

// POST /api/wallet — Add credit to wallet (owner only)
export async function POST(req: NextRequest) {
  const auth = await getAuthClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.profile.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can add credit' }, { status: 403 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = creditSchema.safeParse(json)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
  }

  const { clientId, amount, description } = validation.data

  // Verify client belongs to user's agency
  const { data: client } = await auth.supabase
    .from('clients')
    .select('id, wallet_balance, agency_id')
    .eq('id', clientId)
    .eq('agency_id', auth.profile.agency_id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const currentBalance = client.wallet_balance ?? 0
  const newBalance = currentBalance + amount

  // Update client balance
  const { error: updateError } = await auth.supabase
    .from('clients')
    .update({ wallet_balance: newBalance })
    .eq('id', clientId)

  if (updateError) {
    logger.error('[Wallet] Error updating balance', { error: updateError.message, clientId })
    return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 })
  }

  // Insert transaction record
  const { error: txError } = await auth.supabase
    .from('wallet_transactions')
    .insert({
      client_id: clientId,
      amount,
      type: 'credit',
      description,
      reference_id: null,
      balance_after: newBalance,
      created_by: auth.user.id,
    })

  if (txError) {
    logger.error('[Wallet] Error inserting transaction', { error: txError.message, clientId })
    return NextResponse.json({ error: 'Balance updated but failed to record transaction' }, { status: 500 })
  }

  logger.info('[Wallet] Credit added', { clientId, amount, newBalance })

  return NextResponse.json({ balance: newBalance })
}
