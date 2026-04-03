'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AgencyData {
  id: string
  name: string
  owner_email: string
  legal_name: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  timezone: string | null
  locale: string | null
}

const SIDEBAR_SECTIONS = [
  { group: 'MI EMPRESA', items: ['Perfil de empresa', 'Integraciones'] },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Perfil de empresa')
  const [agency, setAgency] = useState<AgencyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => { if (d.agency) setAgency(d.agency) })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!agency) return
    setSaving(true)
    setSaved(false)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: agency.name,
        legal_name: agency.legal_name,
        phone: agency.phone,
        website: agency.website,
        address: agency.address,
        city: agency.city,
        state: agency.state,
        zip: agency.zip,
        country: agency.country,
        timezone: agency.timezone,
        locale: agency.locale,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    }
  }

  const update = (field: keyof AgencyData, value: string) => {
    if (!agency) return
    setAgency({ ...agency, [field]: value })
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6b8a' }}>
        Cargando configuración...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Settings Sidebar */}
      <div style={{
        width: 220, minHeight: '100%', background: '#0a0a14',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        overflowY: 'auto', padding: '16px 0', flexShrink: 0,
      }}>
        <div style={{ padding: '8px 16px', fontSize: 10, letterSpacing: '0.1em', color: '#ff2ea8', textTransform: 'uppercase', fontWeight: 600 }}>
          CONFIGURACION
        </div>

        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.group}>
            {section.items.map((item) => (
              <div
                key={item}
                onClick={() => setActiveTab(item)}
                style={{
                  padding: '7px 16px', fontSize: 13, cursor: 'pointer',
                  color: activeTab === item ? '#e8e8f0' : '#9090b0',
                  background: activeTab === item ? 'rgba(124,58,237,0.15)' : 'transparent',
                  borderLeft: activeTab === item ? '2px solid #7c3aed' : '2px solid transparent',
                }}
              >
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        {activeTab === 'Perfil de empresa' && agency && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                  Perfil de Empresa
                </h1>
                <p style={{ fontSize: 13, color: '#6b6b8a', margin: 0 }}>
                  Administra la informacion de tu agencia
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 24px', borderRadius: 8, border: 'none', cursor: saving ? 'wait' : 'pointer',
                  background: saved ? '#10b981' : 'linear-gradient(135deg,#ff2ea8,#7c3aed)',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  opacity: saving ? 0.7 : 1, transition: 'all 0.2s',
                }}
              >
                {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              {/* Left: Info */}
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8e8f0', marginBottom: 20 }}>Informacion general</h3>
                <FormField label="Nombre comercial" value={agency.name} onChange={(v) => update('name', v)} />
                <FormField label="Nombre legal de la empresa" value={agency.legal_name ?? ''} onChange={(v) => update('legal_name', v)} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <FormField label="Email de la empresa" value={agency.owner_email} disabled />
                  <FormField label="Telefono" value={agency.phone ?? ''} onChange={(v) => update('phone', v)} />
                </div>
                <FormField label="Sitio web" value={agency.website ?? ''} onChange={(v) => update('website', v)} placeholder="https://" />
              </div>

              {/* Right: Address */}
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8e8f0', marginBottom: 20 }}>Direccion</h3>
                <FormField label="Direccion" value={agency.address ?? ''} onChange={(v) => update('address', v)} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 16 }}>
                  <FormField label="Ciudad" value={agency.city ?? ''} onChange={(v) => update('city', v)} />
                  <FormField label="Codigo postal" value={agency.zip ?? ''} onChange={(v) => update('zip', v)} />
                </div>
                <FormField label="Estado / Provincia" value={agency.state ?? ''} onChange={(v) => update('state', v)} />
                <FormField label="Pais" value={agency.country ?? 'US'} onChange={(v) => update('country', v)} />
                <FormField label="Zona horaria" value={agency.timezone ?? 'America/New_York'} onChange={(v) => update('timezone', v)} />
                <FormField label="Idioma" value={agency.locale ?? 'es'} onChange={(v) => update('locale', v)} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'Integraciones' && (
          <>
            <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
              Integraciones
            </h1>
            <p style={{ fontSize: 13, color: '#6b6b8a', marginBottom: 28 }}>
              Estado de conexion de servicios externos
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <IntegrationCard name="Google Business Profile" icon="G" description="Respuestas automaticas a resenas" connected={false} />
              <IntegrationCard name="Claude AI (Anthropic)" icon="✦" description="Generacion de respuestas inteligentes" connected={false} />
              <IntegrationCard name="Twilio (WhatsApp + SMS)" icon="💬" description="Chatbot y mensajeria" connected={false} />
              <IntegrationCard name="Resend (Email)" icon="📧" description="Secuencias de nurture y reportes" connected={false} />
              <IntegrationCard name="Stripe (Pagos)" icon="💳" description="Facturacion a clientes" connected={false} />
              <IntegrationCard name="Supabase (Base de datos)" icon="⚡" description="Almacenamiento y autenticacion" connected={true} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function FormField({ label, value, onChange, placeholder, disabled }: {
  label: string; value: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, color: '#9090b0', marginBottom: 6 }}>{label}</label>
      <input
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={!onChange}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14, color: disabled ? '#6b6b8a' : '#e8e8f0',
          background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
          boxSizing: 'border-box', outline: 'none',
          opacity: disabled ? 0.6 : 1,
        }}
      />
    </div>
  )
}

function IntegrationCard({ name, icon, description, connected }: {
  name: string; icon: string; description: string; connected: boolean
}) {
  return (
    <div style={{
      background: '#0f0f1a', border: `1px solid ${connected ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12, padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#e8e8f0' }}>{name}</span>
        <div style={{
          marginLeft: 'auto', padding: '3px 10px', borderRadius: 6, fontSize: 11,
          background: connected ? 'rgba(16,185,129,0.15)' : 'rgba(107,107,138,0.15)',
          color: connected ? '#10b981' : '#6b6b8a',
        }}>
          {connected ? 'Conectado' : 'No configurado'}
        </div>
      </div>
      <p style={{ fontSize: 12, color: '#6b6b8a', margin: 0 }}>{description}</p>
    </div>
  )
}
