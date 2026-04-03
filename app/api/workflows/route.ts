import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const workflowTypeEnum = z.enum(['review_reply', 'lead_welcome', 'email_nurture', 'report', 'chatbot'])

const createSchema = z.object({
  name:      z.string().min(1),
  client_id: z.string().uuid(),
  type:      workflowTypeEnum,
  active:    z.boolean().optional(),
})

const updateSchema = z.object({
  id:     z.string().uuid(),
  name:   z.string().min(1).optional(),
  active: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
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

/** Verify that a client belongs to the user's agency */
async function verifyClientOwnership(
  supabase: ReturnType<typeof createServerClient>,
  clientId: string,
  agencyId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('agency_id', agencyId)
    .single()
  return !!data
}

/** Verify that a workflow belongs to the user's agency (through client_id) */
async function verifyWorkflowOwnership(
  supabase: ReturnType<typeof createServerClient>,
  workflowId: string,
  agencyId: string
): Promise<boolean> {
  const { data: workflow } = await supabase
    .from('workflows')
    .select('client_id')
    .eq('id', workflowId)
    .single()

  if (!workflow) return false
  return verifyClientOwnership(supabase, workflow.client_id, agencyId)
}

// POST /api/workflows — create a workflow
export async function POST(req: NextRequest) {
  const auth = await getAuthClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = createSchema.safeParse(json)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
  }

  const { name, client_id, type, active = false } = validation.data

  // Verify agency owns this client
  const owns = await verifyClientOwnership(auth.supabase, client_id, auth.profile.agency_id)
  if (!owns) {
    return NextResponse.json({ error: 'Client not found or not owned by your agency' }, { status: 403 })
  }

  const { data: workflow, error } = await auth.supabase
    .from('workflows')
    .insert({
      name,
      client_id,
      type,
      active,
      config: { nodes: [], edges: [] },
    })
    .select('id')
    .single()

  if (error || !workflow) {
    logger.error('[Workflows] Error creating workflow', { error: error?.message })
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
  }

  return NextResponse.json({ workflow }, { status: 201 })
}

// PATCH /api/workflows — update a workflow
export async function PATCH(req: NextRequest) {
  const auth = await getAuthClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const { id, ...updates } = validation.data

  const owns = await verifyWorkflowOwnership(auth.supabase, id, auth.profile.agency_id)
  if (!owns) {
    return NextResponse.json({ error: 'Workflow not found or not owned by your agency' }, { status: 403 })
  }

  const { error } = await auth.supabase
    .from('workflows')
    .update(updates)
    .eq('id', id)

  if (error) {
    logger.error('[Workflows] Error updating workflow', { error: error.message })
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/workflows — delete a workflow
export async function DELETE(req: NextRequest) {
  const auth = await getAuthClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const owns = await verifyWorkflowOwnership(auth.supabase, id, auth.profile.agency_id)
  if (!owns) {
    return NextResponse.json({ error: 'Workflow not found or not owned by your agency' }, { status: 403 })
  }

  const { error } = await auth.supabase
    .from('workflows')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('[Workflows] Error deleting workflow', { error: error.message })
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
