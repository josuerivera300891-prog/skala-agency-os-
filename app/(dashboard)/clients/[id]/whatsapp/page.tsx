import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Message } from '@/types'

export default async function ClientWhatsApp({ params }: { params: Promise<{ id: string }> }) {
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
  const [{ data: client }, { data: messages }] = await Promise.all([
    supabase.from('clients').select('name').eq('id', id).eq('agency_id', profile.agency_id).single(),
    supabase.from('messages')
      .select('*')
      .eq('client_id', id)
      .eq('channel', 'whatsapp')
      .order('created_at', { ascending: false })
      .limit(50),
  ])


  if (!client) return (
    <div style={{ padding: 28, flex: 1 }}>
      <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Sin datos de WhatsApp</h2>
        <p style={{ fontSize: 13, color: '#6b6b8a' }}>Conecta Supabase para ver las conversaciones.</p>
        <Link href="/clients" style={{ display: 'inline-block', marginTop: 16, padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff', textDecoration: 'none', fontSize: 13 }}>Ver clientes</Link>
      </div>
    </div>
  )

  const msgs = (messages as Message[]) ?? []
  const inbound  = msgs.filter((m) => m.direction === 'inbound').length
  const outbound = msgs.filter((m) => m.direction === 'outbound').length

  // Agrupar por número para mostrar conversaciones
  const threads = msgs.reduce<Record<string, Message[]>>((acc, m) => {
    const number = m.direction === 'inbound' ? m.from_number ?? '' : m.to_number ?? ''
    if (!acc[number]) acc[number] = []
    acc[number].push(m)
    return acc
  }, {})

  return (
    <div style={{ padding: 28, overflowY: 'auto', flex: 1 }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
        WhatsApp — {client.name}
      </h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Mensajes enviados',   value: outbound,                  color: '#7c3aed' },
          { label: 'Mensajes recibidos',  value: inbound,                   color: '#3b82f6' },
          { label: 'Conversaciones',      value: Object.keys(threads).length, color: '#ff2ea8' },
          { label: 'Total mensajes',      value: msgs.length,               color: '#10b981' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b6b8a', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Conversations */}
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Conversaciones</h2>
      <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        {Object.entries(threads).map(([number, threadMsgs], i) => {
          const last = threadMsgs[0]
          return (
            <div key={number} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
              borderBottom: i < Object.keys(threads).length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: '#14141f', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>💬</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#e8e8f0', fontFamily: 'DM Mono, monospace' }}>
                  {number.replace('whatsapp:', '')}
                </div>
                <div style={{ fontSize: 12, color: '#6b6b8a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {last.body?.slice(0, 60)}…
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#6b6b8a', fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>
                {new Date(last.created_at).toLocaleDateString('es-MX')}
              </div>
            </div>
          )
        })}
        {msgs.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#6b6b8a', fontSize: 13 }}>
            Sin mensajes todavía
          </div>
        )}
      </div>
    </div>
  )
}
