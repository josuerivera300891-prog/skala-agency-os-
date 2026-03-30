import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Client, Lead, Review, Workflow } from '@/types'

export default async function ClientPortal({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = await params
  const supabase = await createClient()

  // 1. Obtener usuario y perfil para validación multi-tenant
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id, client_id')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // 2. Si es un cliente, solo puede ver SU propio portal
  if (profile.role === 'client' && profile.client_id !== clientId) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, color: '#e8e8f0' }}>Acceso Denegado</h2>
        <p style={{ color: '#6b6b8a', fontSize: 14 }}>No tienes permisos para ver este portal.</p>
      </div>
    )
  }

  // 3. Consultar datos filtrando por agency_id (o client_id para seguridad extra)
  const [{ data: client }, { data: reviews }, { data: leads }, { data: workflows }, { data: messages }] =
    await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).eq('agency_id', profile.agency_id).single(),
      supabase.from('reviews').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(10),
      supabase.from('leads').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('workflows').select('*').eq('client_id', clientId).eq('active', true),
      supabase.from('messages').select('id').eq('client_id', clientId),
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
    : '—'

  const stats = [
    { label: 'Rating GMB',        value: avgRating,              color: '#f59e0b', icon: '⭐' },
    { label: 'Reseñas',           value: allReviews.length,      color: '#ff2ea8', icon: '★' },
    { label: 'Leads activos',     value: allLeads.length,        color: '#3b82f6', icon: '👤' },
    { label: 'Mensajes WA',       value: messages?.length ?? 0,  color: '#25d366', icon: '💬' },
    { label: 'Automatizaciones',  value: allWorkflows.length,    color: '#7c3aed', icon: '⚡' },
  ]

  const newLeads = allLeads.filter((l) => l.status === 'new').length
  const appointments = allLeads.filter((l) => l.status === 'appointment').length

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#fff',
        }}>{c.name[0]}</div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 24, fontWeight: 700, margin: 0 }}>
            {c.name}
          </h1>
          <p style={{ fontSize: 13, color: '#6b6b8a', fontFamily: 'var(--font-dm-mono), DM Mono, monospace', margin: 0, textTransform: 'capitalize' }}>
            {c.vertical} · Portal de cliente
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 14, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: 26, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* GMB Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,46,168,0.08), rgba(124,58,237,0.08))',
        border: '1px solid rgba(255,46,168,0.15)', borderRadius: 16, padding: '24px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 32,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: 48, color: '#ff2ea8' }}>{avgRating}</div>
          <div style={{ fontSize: 14, color: '#f59e0b' }}>{'★'.repeat(Math.round(Number(avgRating) || 0))}{'☆'.repeat(5 - Math.round(Number(avgRating) || 0))}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, color: '#e8e8f0', fontWeight: 500, marginBottom: 4 }}>{allReviews.length} reseñas totales</div>
          <div style={{ fontSize: 13, color: '#6b6b8a' }}>{allReviews.filter((r) => r.reply_published_at).length} respondidas automaticamente · {allReviews.filter((r) => r.rating <= 3).length} alertas</div>
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
        {/* Últimas reseñas */}
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 24px' }}>
          <h3 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 14, color: '#e8e8f0' }}>Últimas reseñas</h3>
          {allReviews.slice(0, 4).map((r) => (
            <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#e8e8f0' }}>{r.author}</span>
                <span style={{ fontSize: 11, color: '#f59e0b' }}>{'★'.repeat(r.rating)}</span>
              </div>
              {r.text && <p style={{ fontSize: 12, color: '#6b6b8a', margin: '2px 0', lineHeight: 1.5 }}>{r.text.slice(0, 80)}...</p>}
              {r.reply_published_at && <div style={{ fontSize: 10, color: '#7c3aed' }}>✦ respondida</div>}
            </div>
          ))}
        </div>

        {/* Últimos leads */}
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 24px' }}>
          <h3 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 14, color: '#e8e8f0' }}>Últimos leads</h3>
          {allLeads.slice(0, 5).map((l) => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: 'rgba(59,130,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#3b82f6',
              }}>{l.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#e8e8f0' }}>{l.name}</div>
                <div style={{ fontSize: 11, color: '#6b6b8a' }}>{l.source} · {l.service ?? '—'}</div>
              </div>
              <div style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 10,
                background: l.status === 'appointment' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                color: l.status === 'appointment' ? '#10b981' : '#3b82f6',
                fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
              }}>{l.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Automatizaciones activas */}
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
    </div>
  )
}
