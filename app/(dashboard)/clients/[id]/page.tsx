import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Client, Lead, Review } from '@/types'

export default async function ClientOverview({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
  const supabase = await createClient()

  // 1. Obtener usuario y perfil para validación multi-tenant
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id) return null

  // 2. Consultar datos filtrando por el agency_id del perfil
  const [{ data: client }, { data: reviews }, { data: leads }, { data: workflows }] =
    await Promise.all([
      supabase.from('clients').select('*').eq('id', id).eq('agency_id', profile.agency_id).single(),
      supabase.from('reviews').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(5),
      supabase.from('leads').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(5),
      supabase.from('workflows').select('*').eq('client_id', id).eq('active', true),
    ])


  if (!client) {
    return (
      <div style={{ padding: 28, flex: 1 }}>
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⬡</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Cliente no encontrado</h2>
          <p style={{ fontSize: 13, color: '#6b6b8a', lineHeight: 1.6 }}>
            Conecta Supabase en <code style={{ color: '#ff2ea8', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>.env.local</code> o verifica el ID del cliente.
          </p>
          <Link href="/clients" style={{ display: 'inline-block', marginTop: 16, padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff', textDecoration: 'none', fontSize: 13 }}>
            Ver clientes
          </Link>
        </div>
      </div>
    )
  }

  const c = client as Client
  const avgRating = reviews?.length
    ? (reviews.reduce((acc: number, r: Review) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  const tabs = [
    { label: 'Overview',  href: `/clients/${id}` },
    { label: 'Reseñas',   href: `/clients/${id}/reviews` },
    { label: 'Leads',     href: `/clients/${id}/leads` },
    { label: 'WhatsApp',  href: `/clients/${id}/whatsapp` },
  ]

  return (
    <div style={{ padding: 28, overflowY: 'auto', flex: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#fff',
          }}>{c.name[0]}</div>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, margin: 0 }}>{c.name}</h1>
            <p style={{ fontSize: 12, color: '#6b6b8a', fontFamily: 'DM Mono, monospace', margin: 0, textTransform: 'capitalize' }}>
              {c.vertical} · {c.active ? 'Activo' : 'Inactivo'}
            </p>
          </div>
          {c.gmb_location_id && (
            <Link href={`/api/auth/google?clientId=${id}`} style={{
              marginLeft: 'auto', padding: '7px 14px', borderRadius: 8, fontSize: 12,
              background: 'rgba(255,46,168,0.15)', color: '#ff2ea8', textDecoration: 'none', border: '1px solid rgba(255,46,168,0.3)',
            }}>
              Reconectar GMB
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 0 }}>
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} style={{
              padding: '8px 16px', fontSize: 13, color: '#9090b0', textDecoration: 'none',
              borderBottom: '2px solid transparent',
            }}>
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* GMB Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,46,168,0.1), rgba(124,58,237,0.1))',
        border: '1px solid rgba(255,46,168,0.2)', borderRadius: 16, padding: '28px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 32,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: '#ff2ea8' }}>
            {avgRating}
          </div>
          <div style={{ fontSize: 12, color: '#6b6b8a', marginTop: 4 }}>Rating promedio</div>
        </div>
        <div>
          <div style={{ fontSize: 14, color: '#e8e8f0', marginBottom: 4 }}>
            {reviews?.length ?? 0} reseñas procesadas
          </div>
          <div style={{ fontSize: 12, color: '#6b6b8a' }}>
            {reviews?.filter((r: Review) => r.reply_published_at).length ?? 0} respondidas automáticamente
          </div>
          <div style={{ fontSize: 12, color: '#6b6b8a' }}>
            {reviews?.filter((r: Review) => r.rating <= 3).length ?? 0} alertas negativas enviadas
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Leads totales',      value: leads?.length ?? 0,    color: '#3b82f6' },
          { label: 'Automatizaciones',   value: workflows?.length ?? 0, color: '#7c3aed' },
          { label: 'Reseñas (últimas 5)', value: reviews?.length ?? 0,  color: '#ff2ea8' },
        ].map((s) => (
          <div key={s.label} style={{
            background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '20px 24px',
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b6b8a', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Leads */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Section title="Últimos Leads">
          {(leads as Lead[] ?? []).map((lead) => (
            <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#14141f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9090b0' }}>
                {lead.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#e8e8f0' }}>{lead.name}</div>
                <div style={{ fontSize: 11, color: '#6b6b8a' }}>{lead.source} · {lead.status}</div>
              </div>
              <StatusPill status={lead.status} />
            </div>
          ))}
        </Section>

        <Section title="Últimas Reseñas">
          {(reviews as Review[] ?? []).map((review) => (
            <div key={review.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: '#e8e8f0' }}>{review.author}</span>
                <StarRating rating={review.rating} />
              </div>
              {review.text && (
                <p style={{ fontSize: 12, color: '#6b6b8a', margin: '4px 0', lineHeight: 1.5 }}>
                  {review.text.slice(0, 80)}{review.text.length > 80 ? '…' : ''}
                </p>
              )}
              {review.reply_published_at && (
                <div style={{ fontSize: 11, color: '#7c3aed' }}>✦ respondida automáticamente</div>
              )}
            </div>
          ))}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 24px' }}>
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#e8e8f0' }}>{title}</h3>
      {children}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new:         '#3b82f6',
    contacted:   '#7c3aed',
    nurture:     '#f59e0b',
    appointment: '#10b981',
    closed:      '#6b7280',
    cold:        '#374151',
  }
  return (
    <div style={{
      marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 10,
      background: `${colors[status] ?? '#6b7280'}20`,
      color: colors[status] ?? '#6b7280',
      fontFamily: 'DM Mono, monospace',
    }}>
      {status}
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'DM Mono, monospace' }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}
