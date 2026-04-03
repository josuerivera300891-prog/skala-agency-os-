import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Step {
  title: string
  desc: string
  done: boolean
  href: string
}

export default async function LaunchpadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let steps: Step[] = []

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, full_name')
      .eq('id', user.id)
      .single()

    if (profile?.agency_id) {
      // Check real state
      const { data: clients } = await supabase
        .from('clients')
        .select('id, gmb_location_id, config')
        .eq('agency_id', profile.agency_id)

      const clientList = (clients ?? []) as Array<{ id: string; gmb_location_id: string | null; config: Record<string, unknown> | null }>
      const hasClient = clientList.length > 0
      const hasGmb = clientList.some((c) => c.gmb_location_id)
      const hasTwilio = clientList.some((c) => c.config?.twilio_wa_number)

      const { count: leadCount } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .in('client_id', clientList.map((c: { id: string }) => c.id))

      const { count: workflowCount } = await supabase
        .from('workflows')
        .select('id', { count: 'exact', head: true })
        .in('client_id', clientList.map((c: { id: string }) => c.id))
        .eq('active', true)

      steps = [
        {
          title: 'Crear tu primer cliente',
          desc: 'Agrega el primer negocio que vas a gestionar desde Skala.',
          done: hasClient,
          href: '/clients',
        },
        {
          title: 'Conectar Google Business Profile',
          desc: 'Vincula la cuenta de Google para responder resenas automaticamente con IA.',
          done: hasGmb,
          href: hasClient ? `/clients/${clientList[0].id}` : '/clients',
        },
        {
          title: 'Configurar WhatsApp (Twilio)',
          desc: 'Activa el chatbot de WhatsApp para recibir y responder mensajes automaticamente.',
          done: hasTwilio,
          href: '/settings',
        },
        {
          title: 'Recibir tu primer lead',
          desc: 'Cuando un contacto llegue por WhatsApp, web form o referido, aparecera aqui.',
          done: (leadCount ?? 0) > 0,
          href: '/contacts',
        },
        {
          title: 'Activar automatizaciones',
          desc: 'Configura flujos de auto-respuesta, nurture emails y alertas.',
          done: (workflowCount ?? 0) > 0,
          href: '/workflows',
        },
      ]
    }
  }

  const completedCount = steps.filter((s) => s.done).length
  const progress = steps.length ? Math.round((completedCount / steps.length) * 100) : 0

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Guia de configuracion
      </h1>
      <p style={{ fontSize: 14, color: '#9090b0', marginBottom: 28 }}>
        Completa estos pasos para tener tu agencia operativa.
      </p>

      {/* Progress */}
      <div style={{ marginBottom: 24, maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: '#9090b0' }}>{completedCount} de {steps.length} completados</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{progress}%</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: progress === 100 ? '#10b981' : 'linear-gradient(90deg, #3b82f6, #7c3aed)',
            borderRadius: 4, transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
        {steps.map((step, i) => (
          <Link key={i} href={step.href} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 20px',
              background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: i === 0 ? '12px 12px 2px 2px' : i === steps.length - 1 ? '2px 2px 12px 12px' : '2px',
              cursor: 'pointer',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: step.done ? 'rgba(16,185,129,0.15)' : '#14141f',
                border: step.done ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: step.done ? '#10b981' : '#6b6b8a',
              }}>
                {step.done ? '✓' : (i + 1)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14, fontWeight: 500, marginBottom: 2,
                  color: step.done ? '#6b6b8a' : '#e8e8f0',
                  textDecoration: step.done ? 'line-through' : 'none',
                }}>{step.title}</div>
                <div style={{ fontSize: 12, color: '#6b6b8a', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
              {step.done ? (
                <span style={{ fontSize: 12, color: '#10b981', flexShrink: 0 }}>Completado</span>
              ) : (
                <span style={{ fontSize: 12, color: '#7c3aed', flexShrink: 0 }}>Configurar →</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
