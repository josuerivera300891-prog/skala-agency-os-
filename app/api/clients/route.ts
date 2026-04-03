import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const patchSchema = z.object({
  id:       z.string().uuid(),
  name:     z.string().min(1).optional(),
  vertical: z.enum(['restaurante', 'clinica', 'barberia', 'gimnasio', 'retail', 'hotel']).optional(),
  email:    z.string().optional(),
  phone:    z.string().optional(),
  domain:   z.string().optional(),
  active:   z.boolean().optional(),
  config:   z.record(z.string(), z.unknown()).optional(),
})

const deleteSchema = z.object({
  id: z.string().uuid(),
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

// PATCH /api/clients — update a client
export async function PATCH(req: NextRequest) {
  const auth = await getAuthClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = patchSchema.safeParse(json)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
  }

  const { id, ...updates } = validation.data

  // Verify agency ownership
  const { data: client } = await auth.supabase
    .from('clients')
    .select('id')
    .eq('id', id)
    .eq('agency_id', auth.profile.agency_id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const { error } = await auth.supabase
    .from('clients')
    .update(updates)
    .eq('id', id)

  if (error) {
    logger.error('[Clients] Error updating client', { error: error.message, clientId: id })
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  logger.info('[Clients] Client updated', { clientId: id, fields: Object.keys(updates) })
  return NextResponse.json({ ok: true })
}

// DELETE /api/clients — delete a client
export async function DELETE(req: NextRequest) {
  const auth = await getAuthClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.profile.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can delete clients' }, { status: 403 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = deleteSchema.safeParse(json)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
  }

  const { id } = validation.data

  // Verify agency ownership
  const { data: client } = await auth.supabase
    .from('clients')
    .select('id')
    .eq('id', id)
    .eq('agency_id', auth.profile.agency_id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const { error } = await auth.supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('[Clients] Error deleting client', { error: error.message, clientId: id })
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }

  logger.info('[Clients] Client deleted', { clientId: id })
  return NextResponse.json({ ok: true })
}
