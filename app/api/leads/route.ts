import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const leadStatusEnum = z.enum(['new', 'contacted', 'nurture', 'appointment', 'closed', 'cold'])
const leadSourceEnum = z.enum(['whatsapp', 'gmb_call', 'web_form', 'referral'])

const createSchema = z.object({
  name:      z.string().min(1, 'Name is required'),
  phone:     z.string().optional(),
  email:     z.string().email().optional().or(z.literal('')),
  client_id: z.string().uuid('Invalid client_id'),
  source:    leadSourceEnum.optional(),
  service:   z.string().optional(),
  status:    leadStatusEnum.default('new'),
  notes:     z.string().optional(),
})

const updateSchema = z.object({
  leadId:  z.string().uuid('Invalid leadId'),
  name:    z.string().min(1).optional(),
  phone:   z.string().optional(),
  email:   z.string().email().optional().or(z.literal('')),
  source:  leadSourceEnum.optional(),
  service: z.string().optional(),
  status:  leadStatusEnum.optional(),
  notes:   z.string().optional(),
})

const deleteSchema = z.object({
  leadId: z.string().uuid('Invalid leadId'),
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

/** Verify the given client_id belongs to the user's agency */
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

// POST /api/leads — create a new lead
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

  const { client_id, name, phone, email, source, service, status, notes } = validation.data

  const owns = await verifyClientOwnership(auth.supabase, client_id, auth.profile.agency_id)
  if (!owns) {
    return NextResponse.json({ error: 'Client not found in your agency' }, { status: 403 })
  }

  const { data: lead, error } = await auth.supabase
    .from('leads')
    .insert({
      client_id,
      name,
      phone: phone || null,
      email: email || null,
      source: source || null,
      service: service || null,
      status,
      notes: notes || null,
      nurture_day: 0,
      metadata: {},
    })
    .select('*')
    .single()

  if (error) {
    logger.error('[Leads] Error creating lead', { error: error.message })
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }

  logger.info('[Leads] Lead created', { leadId: lead.id, clientId: client_id })
  return NextResponse.json({ lead }, { status: 201 })
}

// PATCH /api/leads — update a lead
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

  const { leadId, ...fields } = validation.data

  // Verify lead belongs to user's agency
  const { data: existingLead } = await auth.supabase
    .from('leads')
    .select('client_id')
    .eq('id', leadId)
    .single()

  if (!existingLead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  const owns = await verifyClientOwnership(auth.supabase, existingLead.client_id, auth.profile.agency_id)
  if (!owns) {
    return NextResponse.json({ error: 'Lead does not belong to your agency' }, { status: 403 })
  }

  // Build update payload, only include defined fields
  const updatePayload: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updatePayload[key] = value === '' ? null : value
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data: lead, error } = await auth.supabase
    .from('leads')
    .update(updatePayload)
    .eq('id', leadId)
    .select('*')
    .single()

  if (error) {
    logger.error('[Leads] Error updating lead', { error: error.message, leadId })
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }

  logger.info('[Leads] Lead updated', { leadId })
  return NextResponse.json({ lead })
}

// DELETE /api/leads — delete a lead
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

  const { leadId } = validation.data

  // Verify lead belongs to user's agency
  const { data: existingLead } = await auth.supabase
    .from('leads')
    .select('client_id')
    .eq('id', leadId)
    .single()

  if (!existingLead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  const owns = await verifyClientOwnership(auth.supabase, existingLead.client_id, auth.profile.agency_id)
  if (!owns) {
    return NextResponse.json({ error: 'Lead does not belong to your agency' }, { status: 403 })
  }

  const { error } = await auth.supabase
    .from('leads')
    .delete()
    .eq('id', leadId)

  if (error) {
    logger.error('[Leads] Error deleting lead', { error: error.message, leadId })
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }

  logger.info('[Leads] Lead deleted', { leadId })
  return NextResponse.json({ ok: true })
}
