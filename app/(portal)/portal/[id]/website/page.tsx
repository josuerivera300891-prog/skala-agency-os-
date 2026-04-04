import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Globe } from 'lucide-react'

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

export default async function PortalWebsite({ params }: { params: Promise<{ id: string }> }) {
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
    .select('name, domain')
    .eq('id', id)
    .single()

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      {/* Header */}
      <div style={{ marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, margin: 0 }}>
          Mi Web
        </h1>
        <p style={{ fontSize: 12, color: '#6b6b8a', margin: '4px 0 0', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
          Gestiona tu presencia web
        </p>
      </div>

      {/* Domain info if available */}
      {client?.domain && (
        <div style={{
          background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '20px 24px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, color: '#6b6b8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Dominio activo</div>
          <div style={{ fontSize: 16, color: '#e8e8f0', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>{client.domain}</div>
        </div>
      )}

      {/* Coming soon placeholder */}
      <div style={{
        background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '60px 40px', textAlign: 'center',
      }}>
        <Globe size={40} style={{ color: '#6b6b8a', marginBottom: 16, opacity: 0.4 }} />
        <h2 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 18, fontWeight: 600, color: '#e8e8f0', marginBottom: 8 }}>
          Tu pagina web
        </h2>
        <p style={{ fontSize: 14, color: '#6b6b8a', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
          Proximamente podras ver y gestionar tu pagina web directamente desde este portal.
          Tu agencia esta trabajando en esta funcionalidad.
        </p>
      </div>
    </div>
  )
}
