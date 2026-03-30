import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Client } from '@/types'

const SUPABASE_CONFIGURED = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function AgencyDashboard() {
  let clients = null, leads = null, reviews = null, workflows = null

  if (SUPABASE_CONFIGURED) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Obtener agency_id del perfil del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', user.id)
        .single()

      if (profile?.agency_id) {
        // Primero obtener IDs de clientes de la agencia
        const { data: agencyClients } = await supabase
          .from('clients')
          .select('id')
          .eq('agency_id', profile.agency_id)
          .eq('active', true)

        const clientIds = (agencyClients ?? []).map((c: { id: string }) => c.id)

        // Obtener clientes completos y datos filtrados por clientIds
        const { data: clientsFull } = await supabase
          .from('clients')
          .select('*')
          .eq('agency_id', profile.agency_id)
          .eq('active', true)

        clients = clientsFull

        if (clientIds.length > 0) {
          const now = Date.now()
          const [leadsRes, reviewsRes, workflowsRes] = await Promise.all([
            supabase.from('leads').select('id, created_at, client_id')
              .in('client_id', clientIds)
              .gte('created_at', new Date(now - 30 * 86400_000).toISOString()),
            supabase.from('reviews').select('id, created_at, client_id')
              .in('client_id', clientIds)
              .gte('created_at', new Date(now - 7 * 86400_000).toISOString()),
            supabase.from('workflows').select('*')
              .in('client_id', clientIds)
              .eq('active', true),
          ])
          leads     = leadsRes.data
          reviews   = reviewsRes.data
          workflows = workflowsRes.data
        }
      }
    }
  }

  const stats = [
    { label: 'Clientes activos',       value: clients?.length ?? 0,   color: '#ff2ea8' },
    { label: 'Reseñas esta semana',    value: reviews?.length ?? 0,   color: '#7c3aed' },
    { label: 'Leads este mes',         value: leads?.length ?? 0,     color: '#3b82f6' },
    { label: 'Automatizaciones vivas', value: workflows?.length ?? 0, color: '#10b981' },
  ]

  return (
    <div style={{ padding: 28, overflowY: 'auto', flex: 1 }}>
      {/* Topbar */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Agency Overview
        </h1>
        <p style={{ fontSize: 12, color: '#6b6b8a', fontFamily: 'DM Mono, monospace' }}>
          Skala Marketing Miami
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '20px 24px',
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: '#6b6b8a', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Client Grid */}
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
        Clientes
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {(clients as Client[] ?? []).map((client) => (
          <Link key={client.id} href={`/clients/${client.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '20px 24px', cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff',
                }}>
                  {client.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#e8e8f0' }}>{client.name}</div>
                  <div style={{ fontSize: 11, color: '#6b6b8a', textTransform: 'capitalize' }}>{client.vertical}</div>
                </div>
                <div style={{
                  marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%',
                  background: client.active ? '#10b981' : '#6b6b8a',
                }} />
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b6b8a' }}>
                {client.gmb_location_id && <span>✦ GMB conectado</span>}
                {client.config.twilio_wa_number && <span>✦ WhatsApp</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
