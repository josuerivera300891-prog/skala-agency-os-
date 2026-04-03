import { createClient } from '@/lib/supabase/server'

export default async function MarketingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const stages = [
    { day: 1, label: 'Bienvenida (Dia 1)', color: '#3b82f6', count: 0 },
    { day: 2, label: 'Seguimiento (Dia 2)', color: '#7c3aed', count: 0 },
    { day: 3, label: 'Testimonios (Dia 3)', color: '#f59e0b', count: 0 },
    { day: 7, label: 'Ultima oportunidad (Dia 7)', color: '#ff2ea8', count: 0 },
  ]

  let totalInNurture = 0
  let totalLeads = 0

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
        const { data: leads } = await supabase
          .from('leads')
          .select('id, nurture_day, status')
          .in('client_id', clientIds)

        const allLeads = (leads ?? []) as Array<{ id: string; nurture_day: number | null; status: string }>
        totalLeads = allLeads.length
        totalInNurture = allLeads.filter((l) => l.status === 'nurture').length

        for (const stage of stages) {
          stage.count = allLeads.filter((l) => l.nurture_day === stage.day).length
        }
      }
    }
  }

  const maxCount = Math.max(...stages.map((s) => s.count), 1)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Marketing
      </h1>
      <p style={{ fontSize: 12, color: '#6b6b8a', marginBottom: 24 }}>
        Email nurture campaigns y estado de leads
      </p>

      {/* Overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-syne), Syne, sans-serif', color: '#3b82f6' }}>{totalLeads}</div>
          <div style={{ fontSize: 13, color: '#e8e8f0', marginTop: 4 }}>Total leads</div>
        </div>
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-syne), Syne, sans-serif', color: '#f59e0b' }}>{totalInNurture}</div>
          <div style={{ fontSize: 13, color: '#e8e8f0', marginTop: 4 }}>En nurture activo</div>
        </div>
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-syne), Syne, sans-serif', color: '#10b981' }}>4</div>
          <div style={{ fontSize: 13, color: '#e8e8f0', marginTop: 4 }}>Emails en secuencia</div>
          <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 2 }}>Dia 1, 2, 3, 7</div>
        </div>
      </div>

      {/* Nurture funnel */}
      <div style={{
        background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: 24, marginBottom: 28,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8e8f0', marginBottom: 20 }}>
          Funnel de Nurture
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {stages.map((stage) => (
            <div key={stage.day} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ width: 180, fontSize: 13, color: '#9090b0' }}>{stage.label}</span>
              <div style={{ flex: 1, height: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  width: `${(stage.count / maxCount) * 100}%`,
                  height: '100%', background: stage.color, borderRadius: 6,
                  minWidth: stage.count > 0 ? 24 : 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                }}>
                  {stage.count > 0 && (
                    <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{stage.count}</span>
                  )}
                </div>
              </div>
              <span style={{ width: 40, fontSize: 13, color: '#e8e8f0', fontWeight: 600, textAlign: 'right' }}>
                {stage.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Email templates info */}
      <div style={{
        background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: 24,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8e8f0', marginBottom: 16 }}>
          Secuencia de Emails
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { day: 'Dia 1', subject: 'Bienvenida', desc: 'Agradecimiento + presentacion de servicios' },
            { day: 'Dia 2', subject: 'Seguimiento', desc: 'Preguntas frecuentes + oferta de ayuda' },
            { day: 'Dia 3', subject: 'Testimonios', desc: 'Social proof + resenas de Google' },
            { day: 'Dia 7', subject: 'Ultima oportunidad', desc: 'Urgencia + CTA final' },
          ].map((t) => (
            <div key={t.day} style={{
              padding: 16, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.07)',
              background: '#14141f',
            }}>
              <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{t.day}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#e8e8f0', marginBottom: 4 }}>{t.subject}</div>
              <div style={{ fontSize: 11, color: '#6b6b8a', lineHeight: 1.5 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
