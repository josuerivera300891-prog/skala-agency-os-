import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { sendWhatsApp } from '@/lib/twilio/whatsapp'

const sendSchema = z.object({
  to:       z.string().min(1),
  clientId: z.string().uuid(),
  body:     z.string().min(1).max(4096),
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

// POST /api/messages/send — send a WhatsApp message
export async function POST(req: NextRequest) {
  const auth = await getAuthClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = sendSchema.safeParse(json)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
  }

  const { to, clientId, body } = validation.data

  // Verify agency ownership of client
  const { data: client } = await auth.supabase
    .from('clients')
    .select('id, config')
    .eq('id', clientId)
    .eq('agency_id', auth.profile.agency_id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  // Determine the Twilio WhatsApp "from" number from client config or env
  const fromNumber = (client.config as Record<string, unknown>)?.twilio_wa_number as string
    ?? process.env.TWILIO_WA_FROM
    ?? ''

  if (!fromNumber) {
    return NextResponse.json({ error: 'No WhatsApp sender number configured for this client' }, { status: 422 })
  }

  // Ensure numbers are in whatsapp: format
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  const fromFormatted = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`

  // Send via Twilio
  const result = await sendWhatsApp({ to: toFormatted, from: fromFormatted, body })

  if (!result) {
    return NextResponse.json({ error: 'Failed to send message via Twilio' }, { status: 502 })
  }

  // Save outbound message to messages table
  const { data: message, error: insertError } = await auth.supabase
    .from('messages')
    .insert({
      client_id:   clientId,
      direction:   'outbound',
      channel:     'whatsapp',
      from_number: fromFormatted,
      to_number:   toFormatted,
      body,
      status:      'sent',
      twilio_sid:  result.sid,
      metadata:    {},
    })
    .select()
    .single()

  if (insertError) {
    logger.error('[Messages] Error saving outbound message', { error: insertError.message, clientId })
    // Message was sent but not saved — still return success with warning
    return NextResponse.json({ ok: true, warning: 'Message sent but failed to save', sid: result.sid })
  }

  logger.info('[Messages] Outbound message sent and saved', { clientId, to: toFormatted, sid: result.sid })
  return NextResponse.json({ ok: true, message })
}
