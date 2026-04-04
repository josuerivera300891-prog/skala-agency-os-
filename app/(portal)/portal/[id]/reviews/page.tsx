import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Review } from '@/types'
import { Star } from 'lucide-react'

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

export default async function PortalReviews({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: reviewsData } = await supabase
    .from('reviews')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  const reviews = (reviewsData as Review[]) ?? []

  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '--'
  const replied = reviews.filter((r) => r.reply_published_at).length
  const alerts = reviews.filter((r) => r.rating <= 3).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, margin: 0 }}>
          Resenas
        </h1>
        <p style={{ fontSize: 12, color: '#6b6b8a', margin: '4px 0 0', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
          {reviews.length} resenas -- Promedio {avgRating} -- {replied} respondidas -- {alerts} alertas
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ padding: '16px 28px', display: 'flex', gap: 16 }}>
        {[
          { label: 'Promedio', value: avgRating, color: '#f59e0b' },
          { label: 'Total', value: reviews.length, color: '#ff2ea8' },
          { label: 'Respondidas', value: replied, color: '#7c3aed' },
          { label: 'Alertas', value: alerts, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} style={{
            background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, padding: '14px 20px', flex: 1,
          }}>
            <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: 22, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Reviews list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 28px' }}>
        {reviews.map((review) => (
          <div key={review.id} style={{
            background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '20px 24px', marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: '#14141f',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: '#9090b0', fontWeight: 600,
                }}>{(review.author ?? '?')[0]}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#e8e8f0' }}>{review.author ?? 'Anonimo'}</div>
                  <div style={{ fontSize: 11, color: '#6b6b8a', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
                    {new Date(review.created_at).toLocaleDateString('es-US', { year: 'numeric', month: 'short', day: '2-digit' })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill={i < review.rating ? '#f59e0b' : 'none'} style={{ color: i < review.rating ? '#f59e0b' : '#374151' }} />
                ))}
              </div>
            </div>

            {review.text && (
              <p style={{ fontSize: 13, color: '#c0c0d0', lineHeight: 1.6, margin: '8px 0' }}>{review.text}</p>
            )}

            {review.reply && (
              <div style={{
                marginTop: 12, padding: '12px 16px', borderRadius: 8,
                background: '#14141f', borderLeft: '3px solid #7c3aed',
              }}>
                <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, marginBottom: 4 }}>Respuesta automatica</div>
                <p style={{ fontSize: 12, color: '#9090b0', lineHeight: 1.5, margin: 0 }}>{review.reply}</p>
              </div>
            )}

            {review.reply_published_at && !review.reply && (
              <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 8 }}>Respondida automaticamente</div>
            )}
          </div>
        ))}

        {reviews.length === 0 && (
          <div style={{
            background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: 40, textAlign: 'center', marginTop: 8,
          }}>
            <Star size={32} style={{ color: '#6b6b8a', marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 13, color: '#6b6b8a' }}>Sin resenas todavia</p>
          </div>
        )}
      </div>
    </div>
  )
}
