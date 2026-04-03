import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Review } from '@/types'

const TABS = ['Visión general', 'Solicitudes', 'Reseñas', 'Testimonios en video', 'Widgets', 'Configuración']

export default async function ReputationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let allReviews: Review[] = []

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (profile?.agency_id) {
      // Obtener IDs de clientes de la agencia
      const { data: agencyClients } = await supabase
        .from('clients')
        .select('id')
        .eq('agency_id', profile.agency_id)

      const clientIds = (agencyClients ?? []).map((c: { id: string }) => c.id)

      if (clientIds.length > 0) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('*')
          .in('client_id', clientIds)
          .order('created_at', { ascending: false })

        allReviews = (reviews as Review[]) ?? []
      }
    }
  }

  const avgRating = allReviews.length
    ? (allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length).toFixed(1)
    : '0'
  const positive = allReviews.filter((r) => r.rating >= 4).length
  const negative = allReviews.filter((r) => r.rating <= 3).length
  const thisMonth = allReviews.filter((r) => {
    const d = new Date(r.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allReviews.filter((r) => r.rating === star).length,
    pct: allReviews.length ? Math.round((allReviews.filter((r) => r.rating === star).length / allReviews.length) * 100) : 0,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Topbar */}
      <div style={{ padding: '0 28px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 20, fontWeight: 700, padding: '16px 0 0' }}>
          Reputación
        </h1>
        <div style={{ display: 'flex', gap: 0, marginTop: 12 }}>
          {TABS.map((tab, i) => (
            <div key={tab} style={{
              padding: '8px 16px', fontSize: 13,
              color: i === 0 ? '#e8e8f0' : '#6b6b8a',
              borderBottom: i === 0 ? '2px solid #ff2ea8' : '2px solid transparent',
              cursor: 'pointer',
            }}>{tab}</div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, margin: 0 }}>Visión general</h2>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <span style={{ fontSize: 13, color: '#e8e8f0', borderBottom: '2px solid #ff2ea8', paddingBottom: 4 }}>Mis Estadísticas</span>
              <span style={{ fontSize: 13, color: '#6b6b8a', paddingBottom: 4 }}>Análisis de la competencia</span>
            </div>
          </div>
          <button style={{
            padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 500,
          }}>Enviar solicitud de reseña</button>
        </div>

        {/* AI Summary */}
        <div style={{
          background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '24px 28px', marginBottom: 24,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>✦</span>
              <span style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 600, fontSize: 16 }}>AI Resumen</span>
            </div>
            <p style={{ fontSize: 13, color: '#9090b0', lineHeight: 1.7 }}>
              Genera un resumen inteligente con IA de las reseñas de clientes en las páginas seleccionadas y los rangos de fechas que elijas.
            </p>
            <a href="#" style={{ fontSize: 13, color: '#ff2ea8', textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>
              Descubre Reviews AI →
            </a>
          </div>
          <div style={{
            background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 12, padding: '20px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ color: '#7c3aed', fontSize: 14 }}>✦</span>
              <span style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 600, fontSize: 14, color: '#7c3aed' }}>AI Resumen</span>
            </div>
            <p style={{ fontSize: 12, color: '#9090b0', lineHeight: 1.7, margin: 0 }}>
              Los clientes valoran altamente la activación de servicios locales en Google, creación de sitios web, seguimiento de leads por CRM y gestión de reseñas. Destacan la profesionalidad, capacidad de respuesta y servicio personalizado del equipo.
            </p>
            <div style={{ marginTop: 10, fontSize: 11, color: '#6b6b8a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>🔵</span> De {allReviews.length} Reseñas
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {/* Objetivo de invitaciones */}
          <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '24px' }}>
            <div style={{ fontSize: 14, color: '#e8e8f0', fontWeight: 500, marginBottom: 16 }}>Objetivo de invitaciones</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#3b82f6" strokeWidth="8"
                    strokeDasharray={`${(thisMonth / 20) * 213.6} 213.6`}
                    strokeLinecap="round" transform="rotate(-90 40 40)" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: 24, color: '#3b82f6' }}>
                  {thisMonth}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b6b8a' }}>de 20</div>
              </div>
            </div>
          </div>

          {/* Reseñas recibidas */}
          <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '24px' }}>
            <div style={{ fontSize: 14, color: '#e8e8f0', fontWeight: 500, marginBottom: 16 }}>Reseñas recibidas</div>
            <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: 36, color: '#ff2ea8', marginBottom: 4 }}>
              {allReviews.length}
            </div>
            <div style={{ fontSize: 12, color: '#6b6b8a' }}>total historico</div>
            {/* Mini bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, marginTop: 12, height: 40 }}>
              {ratingDist.map((d) => (
                <div key={d.star} style={{
                  flex: 1, borderRadius: '4px 4px 0 0',
                  background: d.star >= 4 ? '#ff2ea8' : d.star === 3 ? '#f59e0b' : '#ef4444',
                  height: `${Math.max(d.pct, 5)}%`,
                  opacity: 0.7,
                }} />
              ))}
            </div>
          </div>

          {/* Sentimiento */}
          <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '24px' }}>
            <div style={{ fontSize: 14, color: '#e8e8f0', fontWeight: 500, marginBottom: 16 }}>Sentimiento</div>
            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 22 }}>👍</span>
                <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: 28, color: '#10b981', marginTop: 4 }}>{positive}</div>
                <div style={{ fontSize: 11, color: '#10b981' }}>{allReviews.length ? Math.round((positive / allReviews.length) * 100) : 0}%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 22 }}>👎</span>
                <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: 28, color: '#ef4444', marginTop: 4 }}>{negative}</div>
                <div style={{ fontSize: 11, color: '#6b6b8a' }}>{allReviews.length ? Math.round((negative / allReviews.length) * 100) : 0}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rating distribution */}
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '24px', marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: '#e8e8f0', fontWeight: 500, marginBottom: 16 }}>Distribución de calificaciones</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: 42, color: '#f59e0b' }}>{avgRating}</div>
            <div>
              <div style={{ color: '#f59e0b', fontSize: 16 }}>{'★'.repeat(Math.round(Number(avgRating)))}{'☆'.repeat(5 - Math.round(Number(avgRating)))}</div>
              <div style={{ fontSize: 12, color: '#6b6b8a', marginTop: 2 }}>{allReviews.length} reseñas totales</div>
            </div>
          </div>
          {ratingDist.map((d) => (
            <div key={d.star} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#6b6b8a', width: 20, textAlign: 'right' }}>{d.star}★</span>
              <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${d.pct}%`, height: '100%', background: '#f59e0b', borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 11, color: '#6b6b8a', fontFamily: 'var(--font-dm-mono), DM Mono, monospace', width: 30 }}>{d.count}</span>
            </div>
          ))}
        </div>

        {/* Recent reviews */}
        <div style={{ fontSize: 14, color: '#e8e8f0', fontWeight: 500, marginBottom: 12 }}>Reseñas recientes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allReviews.slice(0, 5).map((review) => (
            <div key={review.id} style={{
              background: '#0f0f1a', border: `1px solid ${review.rating <= 3 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 12, padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 500, fontSize: 14, color: '#e8e8f0' }}>{review.author ?? 'Anónimo'}</span>
                <span style={{ fontSize: 12, color: '#f59e0b' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              {review.text && <p style={{ fontSize: 13, color: '#9090b0', lineHeight: 1.6, margin: '0 0 8px' }}>{review.text}</p>}
              {review.reply && (
                <div style={{ background: 'rgba(124,58,237,0.08)', borderLeft: '3px solid #7c3aed', padding: '8px 12px', borderRadius: '0 8px 8px 0', fontSize: 13, color: '#e8e8f0' }}>
                  <span style={{ fontSize: 10, color: '#7c3aed', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>✦ respondida automáticamente</span>
                  <p style={{ margin: '4px 0 0' }}>{review.reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
