import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Lead } from '@/types'
import { Users } from 'lucide-react'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new:         { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  contacted:   { bg: 'rgba(124,58,237,0.15)', color: '#7c3aed' },
  nurture:     { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  appointment: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  closed:      { bg: 'rgba(16,185,129,0.25)', color: '#10b981' },
  cold:        { bg: 'rgba(107,107,138,0.15)', color: '#6b6b8a' },
}

async function validatePortalAccess(supabase: Awaited<ReturnType<typeof createClient>>, clientId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id, client_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  if (profile.role === 'client' && profile.client_id !== clientId) return null

  if (profile.role !== 'client') {
    const { data: client } = await supabase
      .from('clients')
      .select('agency_id')
      .eq('id', clientId)
      .single()
    if (!client || client.agency_id !== profile.agency_id) return null
  }

  return profile
}

export default async function PortalLeads({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const profile = await validatePortalAccess(supabase, id)
  if (!profile) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, color: '#e8e8f0' }}>Acceso denegado</h2>
        <p style={{ color: '#6b6b8a', fontSize: 14 }}>No tienes permisos para ver esta seccion.</p>
      </div>
    )
  }

  const { data: leadsData } = await supabase
    .from('leads')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(200)

  const leads = (leadsData as Lead[]) ?? []
  const newLeads = leads.filter((l) => l.status === 'new').length
  const appointments = leads.filter((l) => l.status === 'appointment').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, margin: 0 }}>
          Leads
        </h1>
        <p style={{ fontSize: 12, color: '#6b6b8a', margin: '4px 0 0', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
          {leads.length} contactos -- {newLeads} nuevos -- {appointments} con cita
        </p>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 28px' }}>
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', marginTop: 20 }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 130px 160px 90px 90px 100px',
            padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
            fontSize: 11, color: '#6b6b8a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span>Nombre</span>
            <span>Telefono</span>
            <span>Email</span>
            <span>Fuente</span>
            <span>Estado</span>
            <span>Fecha</span>
          </div>

          {leads.map((lead, i) => {
            const st = STATUS_COLORS[lead.status] ?? STATUS_COLORS.cold
            return (
              <div key={lead.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 130px 160px 90px 90px 100px',
                padding: '14px 16px', alignItems: 'center',
                borderBottom: i < leads.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                fontSize: 13, color: '#e8e8f0',
              }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{lead.name}</div>
                  {lead.service && <div style={{ fontSize: 11, color: '#6b6b8a' }}>{lead.service}</div>}
                </div>
                <span style={{ fontSize: 12, color: '#9090b0', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
                  {lead.phone ?? '--'}
                </span>
                <span style={{ fontSize: 12, color: '#9090b0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lead.email ?? '--'}
                </span>
                <span style={{ fontSize: 12, color: '#9090b0' }}>
                  {lead.source ?? '--'}
                </span>
                <span style={{
                  padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                  background: st.bg, color: st.color, textTransform: 'capitalize',
                  display: 'inline-block', width: 'fit-content',
                }}>
                  {lead.status}
                </span>
                <span style={{ fontSize: 11, color: '#6b6b8a', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
                  {new Date(lead.created_at).toLocaleDateString('es-US', { month: 'short', day: '2-digit' })}
                </span>
              </div>
            )
          })}

          {leads.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b6b8a' }}>
              <Users size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontSize: 13 }}>Sin leads todavia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
