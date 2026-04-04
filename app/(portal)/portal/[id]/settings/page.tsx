import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Client } from '@/types'
import { Settings, Building2, Phone, Mail, Globe } from 'lucide-react'

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

export default async function PortalSettings({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: clientData } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  const client = clientData as Client | null

  if (!client) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, color: '#e8e8f0' }}>Informacion no disponible</h2>
        <p style={{ color: '#6b6b8a', fontSize: 14 }}>No se pudo cargar la informacion del negocio.</p>
      </div>
    )
  }

  const infoRows: { icon: typeof Building2; label: string; value: string }[] = [
    { icon: Building2, label: 'Nombre del negocio', value: client.name },
    { icon: Phone,     label: 'Telefono',           value: client.phone ?? client.config?.phone ?? 'No configurado' },
    { icon: Mail,      label: 'Email',              value: client.email ?? 'No configurado' },
    { icon: Globe,     label: 'Dominio',            value: client.domain ?? 'No configurado' },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      {/* Header */}
      <div style={{ marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, margin: 0 }}>
          Configuracion
        </h1>
        <p style={{ fontSize: 12, color: '#6b6b8a', margin: '4px 0 0', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
          Informacion de tu negocio (solo lectura)
        </p>
      </div>

      {/* Business info */}
      <div style={{
        background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '24px', marginBottom: 20,
      }}>
        <h3 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 20, color: '#e8e8f0' }}>
          Datos del negocio
        </h3>

        {infoRows.map((row) => {
          const Icon = row.icon
          return (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <Icon size={18} style={{ color: '#6b6b8a', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#6b6b8a', marginBottom: 2 }}>{row.label}</div>
                <div style={{ fontSize: 14, color: '#e8e8f0' }}>{row.value}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Vertical / status */}
      <div style={{
        background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '24px', marginBottom: 20,
      }}>
        <h3 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 20, color: '#e8e8f0' }}>
          Estado de la cuenta
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Settings size={18} style={{ color: '#6b6b8a', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#6b6b8a', marginBottom: 2 }}>Vertical</div>
            <div style={{ fontSize: 14, color: '#e8e8f0', textTransform: 'capitalize' }}>{client.vertical}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: client.active ? '#10b981' : '#ef4444',
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#6b6b8a', marginBottom: 2 }}>Estado</div>
            <div style={{ fontSize: 14, color: client.active ? '#10b981' : '#ef4444' }}>
              {client.active ? 'Activo' : 'Inactivo'}
            </div>
          </div>
        </div>

        {client.config?.services && client.config.services.length > 0 && (
          <div style={{ padding: '14px 0' }}>
            <div style={{ fontSize: 11, color: '#6b6b8a', marginBottom: 8 }}>Servicios</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {client.config.services.map((service) => (
                <span key={service} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12,
                  background: 'rgba(124,58,237,0.15)', color: '#7c3aed',
                }}>
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Wallet */}
      <div style={{
        background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '24px',
      }}>
        <h3 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#e8e8f0' }}>
          Billetera
        </h3>
        <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: 28, color: '#10b981' }}>
          ${Number(client.wallet_balance ?? 0).toFixed(2)}
        </div>
        <div style={{ fontSize: 12, color: '#6b6b8a', marginTop: 4 }}>Balance disponible</div>
      </div>
    </div>
  )
}
