import { createClient } from '@/lib/supabase/server'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let stats = { reviews: 0, leads: 0, messages: 0, workflows: 0, avgRating: '0', topSource: '—' }
  let weeklyData: Array<{ week: string; reviews: number; leads: number }> = []

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (profile?.agency_id) {
      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .eq('agency_id', profile.agency_id)

      const clientIds = (clients ?? []).map((c: { id: string }) => c.id)

      if (clientIds.length > 0) {
        const now = Date.now()
        const thirtyDaysAgo = new Date(now - 30 * 86400_000).toISOString()

        const [reviewsRes, leadsRes, messagesRes, workflowsRes] = await Promise.all([
          supabase.from('reviews').select('id, rating, created_at').in('client_id', clientIds).gte('created_at', thirtyDaysAgo),
          supabase.from('leads').select('id, source, created_at').in('client_id', clientIds).gte('created_at', thirtyDaysAgo),
          supabase.from('messages').select('id').in('client_id', clientIds).gte('created_at', thirtyDaysAgo),
          supabase.from('workflow_runs').select('id, status').in('client_id', clientIds).gte('created_at', thirtyDaysAgo),
        ])

        const reviews = (reviewsRes.data ?? []) as Array<{ id: string; rating: number; created_at: string }>
        const leads = (leadsRes.data ?? []) as Array<{ id: string; source: string; created_at: string }>

        stats.reviews = reviews.length
        stats.leads = leads.length
        stats.messages = (messagesRes.data ?? []).length
        stats.workflows = (workflowsRes.data ?? []).length
        stats.avgRating = reviews.length
          ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
          : '0'

        // Top source
        const sourceCounts: Record<string, number> = {}
        for (const l of leads) {
          sourceCounts[l.source] = (sourceCounts[l.source] ?? 0) + 1
        }
        const topEntry = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]
        stats.topSource = topEntry ? topEntry[0] : '—'

        // Weekly breakdown (last 4 weeks)
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(now - (i + 1) * 7 * 86400_000)
          const weekEnd = new Date(now - i * 7 * 86400_000)
          const label = weekStart.toLocaleDateString('es', { month: 'short', day: 'numeric' })
          weeklyData.push({
            week: label,
            reviews: reviews.filter((r) => new Date(r.created_at) >= weekStart && new Date(r.created_at) < weekEnd).length,
            leads: leads.filter((l) => new Date(l.created_at) >= weekStart && new Date(l.created_at) < weekEnd).length,
          })
        }
      }
    }
  }

  const maxBar = Math.max(...weeklyData.map((w) => w.reviews + w.leads), 1)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Reportes
      </h1>
      <p style={{ fontSize: 12, color: '#6b6b8a', marginBottom: 24, fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
        Ultimos 30 dias
      </p>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Resenas', value: stats.reviews, color: '#f59e0b', sub: `Promedio ${stats.avgRating}★` },
          { label: 'Leads', value: stats.leads, color: '#3b82f6', sub: `Top: ${stats.topSource}` },
          { label: 'Mensajes', value: stats.messages, color: '#25d366', sub: 'WhatsApp + SMS + Email' },
          { label: 'Automatizaciones', value: stats.workflows, color: '#7c3aed', sub: 'Ejecuciones de workflows' },
        ].map((s) => (
          <div key={s.label} style={{
            background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '20px 24px',
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-syne), Syne, sans-serif', color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: '#e8e8f0', marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <div style={{
        background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: 24, marginBottom: 28,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8e8f0', marginBottom: 20 }}>
          Actividad semanal
        </h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160 }}>
          {weeklyData.map((w) => (
            <div key={w.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 120, width: '100%' }}>
                <div style={{
                  flex: 1, borderRadius: '4px 4px 0 0',
                  background: '#f59e0b',
                  height: `${(w.reviews / maxBar) * 100}%`,
                  minHeight: w.reviews > 0 ? 4 : 0,
                }} />
                <div style={{
                  flex: 1, borderRadius: '4px 4px 0 0',
                  background: '#3b82f6',
                  height: `${(w.leads / maxBar) * 100}%`,
                  minHeight: w.leads > 0 ? 4 : 0,
                }} />
              </div>
              <span style={{ fontSize: 10, color: '#6b6b8a' }}>{w.week}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
          <span style={{ fontSize: 11, color: '#6b6b8a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} /> Resenas
          </span>
          <span style={{ fontSize: 11, color: '#6b6b8a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }} /> Leads
          </span>
        </div>
      </div>
    </div>
  )
}
