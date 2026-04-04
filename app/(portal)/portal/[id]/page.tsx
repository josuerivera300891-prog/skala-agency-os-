import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Client, Lead, Review, Workflow } from '@/types'
import { BarChart3, Star, Users, MessageSquare, Zap } from 'lucide-react'

async function validatePortalAccess(supabase: Awaited<ReturnType<typeof createClient>>, clientId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id, client_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Client role: can only see their own portal
  if (profile.role === 'client' && profile.client_id !== clientId) {
    return null
  }

  // Owner/member: must belong to same agency
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

export default async function PortalDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const profile = await validatePortalAccess(supabase, id)
  if (!profile) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, color: '#e8e8f0' }}>Acceso denegado</h2>
        <p style={{ color: '#6b6b8a', fontSize: 14 }}>No tienes permisos para ver este portal.</p>
      </div>
    )
  }

  const [{ data: client }, { data: reviews }, { data: leads }, { data: workflows }, { data: messages }] =
    await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('reviews').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(10),
      supabase.from('leads').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('workflows').select('*').eq('client_id', id).eq('active', true),
      supabase.from('messages').select('id').eq('client_id', id),
    ])

  if (!client) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, color: '#e8e8f0' }}>Portal no disponible</h2>
        <p style={{ color: '#6b6b8a', fontSize: 14 }}>Contacta a tu agencia para obtener acceso.</p>
      </div>
    )
  }

  const c = client as Client
  const allReviews = (reviews as Review[]) ?? []
  const allLeads = (leads as Lead[]) ?? []
  const allWorkflows = (workflows as Workflow[]) ?? []

  const avgRating = allReviews.length
    ? (allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length).toFixed(1)
    : '--'

  const newLeads = allLeads.filter((l) => l.status === 'new').length
  const appointments = allLeads.filter((l) => l.status === 'appointment').length

  const stats = [
    { label: 'Rating GMB',       value: avgRating,              color: '#f59e0b', Icon: Star },
    { label: 'Resenas',          value: allReviews.length,      color: '#ff2ea8', Icon: BarChart3 },
    { label: 'Leads activos',    value: allLeads.length,        color: '#3b82f6', Icon: Users },
    { label: 'Mensajes WA',      value: messages?.length ?? 0,  color: '#25d366', Icon: MessageSquare },
    { label: 'Automatizaciones', value: allWorkflows.length,    color: '#7c3aed', Icon: Zap },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12,
          background: '#7c3aed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff',
        }}>{c.name[0]}</div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 24, fontWeight: 700, margin: 0 }}>
            {c.name}
          </h1>
          <p style={{ fontSize: 13, color: '#6b6b8a', fontFamily: 'var(--font-dm-mono), DM Mono, monospace', margin: 0, textTransform: 'capitalize' }}>
            {c.vertical} -- Portal de cliente
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
        {stats.map((s) => {
          const IconComp = s.Icon
          return (
            <div key={s.label} style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 20px' }}>
              <IconComp size={18} style={{ color: s.color, marginBottom: 8 }} />
              <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: 26, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 2 }}>{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* GMB summary */}
      <div style={{
        background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 32,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: 48, color: '#ff2ea8' }}>{avgRating}</div>
          <div style={{ fontSize: 14, color: '#f59e0b' }}>{'*'.repeat(Math.round(Number(avgRating) || 0))}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, color: '#e8e8f0', fontWeight: 500, marginBottom: 4 }}>{allReviews.length} resenas totales</div>
          <div style={{ fontSize: 13, color: '#6b6b8a' }}>
            {allReviews.filter((r) => r.reply_published_at).length} respondidas automaticamente
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: 24, color: '#3b82f6' }}>{newLeads}</div>
            <div style={{ fontSize: 11, color: '#6b6b8a' }}>Leads nuevos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: 24, color: '#10b981' }}>{appointments}</div>
            <div style={{ fontSize: 11, color: '#6b6b8a' }}>Citas</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Latest reviews */}
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 24px' }}>
          <h3 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 14, color: '#e8e8f0' }}>Ultimas resenas</h3>
          {allReviews.slice(0, 4).map((r) => (
            <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#e8e8f0' }}>{r.author}</span>
                <StarRating rating={r.rating} />
              </div>
              {r.text && <p style={{ fontSize: 12, color: '#6b6b8a', margin: '2px 0', lineHeight: 1.5 }}>{r.text.slice(0, 80)}{r.text.length > 80 ? '...' : ''}</p>}
              {r.reply_published_at && <div style={{ fontSize: 10, color: '#7c3aed' }}>Respondida automaticamente</div>}
            </div>
          ))}
          {allReviews.length === 0 && <p style={{ fontSize: 13, color: '#6b6b8a' }}>Sin resenas todavia</p>}
        </div>

        {/* Latest leads */}
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 24px' }}>
          <h3 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 14, color: '#e8e8f0' }}>Ultimos leads</h3>
          {allLeads.slice(0, 5).map((l) => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: 'rgba(59,130,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#3b82f6',
              }}>{l.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#e8e8f0' }}>{l.name}</div>
                <div style={{ fontSize: 11, color: '#6b6b8a' }}>{l.source} -- {l.service ?? '--'}</div>
              </div>
              <StatusPill status={l.status} />
            </div>
          ))}
          {allLeads.length === 0 && <p style={{ fontSize: 13, color: '#6b6b8a' }}>Sin leads todavia</p>}
        </div>
      </div>

      {/* Active workflows */}
      {allWorkflows.length > 0 && (
        <div style={{ marginTop: 20, background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 24px' }}>
          <h3 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 14, color: '#e8e8f0' }}>Automatizaciones activas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
            {allWorkflows.map((wf) => (
              <div key={wf.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#14141f', borderRadius: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                <div>
                  <div style={{ fontSize: 13, color: '#e8e8f0' }}>{wf.name}</div>
                  <div style={{ fontSize: 11, color: '#6b6b8a' }}>{wf.runs_today} ejecuciones hoy</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: '#3b82f6', contacted: '#7c3aed', nurture: '#f59e0b',
    appointment: '#10b981', closed: '#6b7280', cold: '#374151',
  }
  const c = colors[status] ?? '#6b7280'
  return (
    <div style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 10,
      background: `${c}20`, color: c,
      fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
    }}>
      {status}
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
      {'*'.repeat(rating)}{'_'.repeat(5 - rating)}
    </span>
  )
}
