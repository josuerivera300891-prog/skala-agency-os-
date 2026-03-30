import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Edge Function: se dispara con database webhook INSERT en tabla leads
serve(async (req) => {
  const { record } = await req.json() as { record: Record<string, unknown> }

  if (!record?.id) {
    return new Response('No record', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Traer datos del cliente
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', record.client_id)
    .single()

  if (!client) {
    return new Response('Client not found', { status: 404 })
  }

  const appUrl = Deno.env.get('APP_URL')!
  const cronSecret = Deno.env.get('CRON_SECRET')!
  const serviceHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${cronSecret}`,
  }
  const results = []

  // 1. Enviar WhatsApp de bienvenida si tiene teléfono
  if (record.phone) {
    const waRes = await fetch(`${appUrl}/api/whatsapp/send`, {
      method:  'POST',
      headers: serviceHeaders,
      body: JSON.stringify({
        to:       record.phone,
        clientId: client.id,
        template: 'lead_welcome',
        data: {
          leadName:   record.name,
          service:    record.service,
          clientName: client.name,
        },
      }),
    })
    results.push({ type: 'whatsapp', ok: waRes.ok })
  }

  // 2. Enviar email de bienvenida si tiene email
  if (record.email) {
    const emailRes = await fetch(`${appUrl}/api/email/nurture`, {
      method:  'POST',
      headers: serviceHeaders,
      body: JSON.stringify({ leadId: record.id, day: 1 }),
    })
    results.push({ type: 'email', ok: emailRes.ok })
  }

  // 3. Actualizar status del lead
  await supabase
    .from('leads')
    .update({ status: 'contacted', nurture_day: 1 })
    .eq('id', record.id)

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
