import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Review } from '@/types'

export default async function ClientReviews({ params }: { params: Promise<{ id: string }> }) {
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

  // 2. Consultar datos filtrando por agency_id para asegurar aislamiento
  const [{ data: client }, { data: reviews }] = await Promise.all([
    supabase.from('clients').select('name').eq('id', id).eq('agency_id', profile.agency_id).single(),
    supabase.from('reviews').select('*').eq('client_id', id).order('created_at', { ascending: false }),
  ])


  if (!client) return (
    <div style={{ padding: 28, flex: 1 }}>
      <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>★</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Sin datos de resenas</h2>
        <p style={{ fontSize: 13, color: '#6b6b8a' }}>Conecta Supabase para ver resenas del cliente.</p>
        <Link href="/clients" style={{ display: 'inline-block', marginTop: 16, padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff', textDecoration: 'none', fontSize: 13 }}>Ver clientes</Link>
      </div>
    </div>
  )

  const avgRating = reviews?.length
    ? (reviews.reduce((acc: number, r: Review) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  const respondidas = reviews?.filter((r: Review) => r.reply_published_at).length ?? 0
  const negativas   = reviews?.filter((r: Review) => r.rating <= 3).length ?? 0

  return (
    <div style={{ padding: 28, overflowY: 'auto', flex: 1 }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
        Reseñas — {client.name}
      </h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Rating promedio',     value: avgRating,           color: '#f59e0b' },
          { label: 'Total reseñas',        value: reviews?.length ?? 0, color: '#ff2ea8' },
          { label: 'Respondidas auto',    value: respondidas,         color: '#7c3aed' },
          { label: 'Alertas negativas',   value: negativas,           color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b6b8a', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Reviews Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(reviews as Review[] ?? []).map((review) => (
          <div key={review.id} style={{
            background: '#0f0f1a', border: `1px solid ${review.rating <= 3 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 12, padding: '20px 24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#e8e8f0' }}>{review.author ?? 'Anónimo'}</span>
                <span style={{ marginLeft: 10, fontSize: 12, color: '#f59e0b', fontFamily: 'DM Mono, monospace' }}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#6b6b8a', fontFamily: 'DM Mono, monospace' }}>
                {new Date(review.created_at).toLocaleDateString('es-MX')}
              </span>
            </div>

            {review.text && (
              <p style={{ fontSize: 13, color: '#9090b0', margin: '0 0 12px', lineHeight: 1.6 }}>
                &ldquo;{review.text}&rdquo;
              </p>
            )}

            {review.reply && (
              <div style={{ background: 'rgba(124,58,237,0.1)', borderLeft: '3px solid #7c3aed', padding: '10px 14px', borderRadius: '0 8px 8px 0' }}>
                <div style={{ fontSize: 11, color: '#7c3aed', fontFamily: 'DM Mono, monospace', marginBottom: 4 }}>
                  ✦ respondida automáticamente{review.reply_published_at ? ` · ${new Date(review.reply_published_at).toLocaleDateString('es-MX')}` : ''}
                </div>
                <p style={{ fontSize: 13, color: '#e8e8f0', margin: 0, lineHeight: 1.6 }}>{review.reply}</p>
              </div>
            )}

            {review.rating <= 3 && review.alert_sent && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#ef4444' }}>⚠️ Alerta SMS enviada al dueño</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
