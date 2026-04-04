import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Message } from '@/types'
import { MessageSquare, ArrowDownLeft, ArrowUpRight } from 'lucide-react'

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

export default async function PortalMessages({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: client } = await supabase
    .from('clients')
    .select('name')
    .eq('id', id)
    .single()

  const { data: messagesData } = await supabase
    .from('messages')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(100)

  const messages = (messagesData as Message[]) ?? []
  const inbound = messages.filter((m) => m.direction === 'inbound').length
  const outbound = messages.filter((m) => m.direction === 'outbound').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, margin: 0 }}>
          Mensajes
        </h1>
        <p style={{ fontSize: 12, color: '#6b6b8a', margin: '4px 0 0', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
          {messages.length} mensajes -- {inbound} recibidos -- {outbound} enviados
        </p>
      </div>

      {/* Messages list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 28px' }}>
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', marginTop: 20 }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 100px 1fr 120px 100px',
            padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
            fontSize: 11, color: '#6b6b8a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span></span>
            <span>Canal</span>
            <span>Mensaje</span>
            <span>Contacto</span>
            <span>Fecha</span>
          </div>

          {messages.map((msg, i) => (
            <div key={msg.id} style={{
              display: 'grid', gridTemplateColumns: '40px 100px 1fr 120px 100px',
              padding: '14px 16px', alignItems: 'center',
              borderBottom: i < messages.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              fontSize: 13, color: '#e8e8f0',
            }}>
              <div>
                {msg.direction === 'inbound'
                  ? <ArrowDownLeft size={16} style={{ color: '#3b82f6' }} />
                  : <ArrowUpRight size={16} style={{ color: '#10b981' }} />
                }
              </div>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 6, width: 'fit-content',
                background: msg.channel === 'whatsapp' ? 'rgba(37,211,102,0.15)' : 'rgba(59,130,246,0.15)',
                color: msg.channel === 'whatsapp' ? '#25d366' : '#3b82f6',
                fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
              }}>
                {msg.channel}
              </span>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
                {msg.body ?? '--'}
              </div>
              <span style={{ fontSize: 12, color: '#9090b0', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
                {msg.from_number ?? msg.to_number ?? '--'}
              </span>
              <span style={{ fontSize: 11, color: '#6b6b8a', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
                {new Date(msg.created_at).toLocaleDateString('es-US', { month: 'short', day: '2-digit' })}
              </span>
            </div>
          ))}

          {messages.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b6b8a' }}>
              <MessageSquare size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontSize: 13 }}>Sin mensajes todavia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
