'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface IntegrationStatus {
  google: boolean
  ai: boolean
  twilio: boolean
  resend: boolean
  stripe: boolean
  supabase: boolean
}

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
  domain_markup: number | null
}

const SIDEBAR_SECTIONS = [
  { group: 'MI EMPRESA', items: ['Perfil de empresa', 'Integraciones', 'Migracion'] },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Perfil de empresa')
  const [agency, setAgency] = useState<AgencyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [integrations, setIntegrations] = useState<IntegrationStatus>({
    google: false, ai: false, twilio: false, resend: false, stripe: false, supabase: true,
  })

  // Migration state
  const [ghlApiKey, setGhlApiKey] = useState('')
  const [migrating, setMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<{
    imported: number
    skipped: number
    locations: Array<{ name: string; status: 'imported' | 'skipped'; ghl_id: string }>
  } | null>(null)
  const [migrationError, setMigrationError] = useState('')

  const router = useRouter()

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => { if (d.agency) setAgency(d.agency) })
      .finally(() => setLoading(false))

    fetch('/api/settings/integrations')
      .then((r) => r.json())
      .then((d) => { if (!d.error) setIntegrations(d) })
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
        domain_markup: agency.domain_markup,
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
                <FormField
                  label="Markup de dominios (%)"
                  value={agency.domain_markup ? String(Math.round((agency.domain_markup - 1) * 100)) : ''}
                  onChange={(v) => {
                    if (!agency) return
                    const pct = parseFloat(v)
                    if (v === '') {
                      setAgency({ ...agency, domain_markup: null })
                    } else if (!isNaN(pct)) {
                      setAgency({ ...agency, domain_markup: 1 + pct / 100 })
                    }
                  }}
                  placeholder="25"
                />
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
              <IntegrationCard name="Google Business Profile" icon="G" description="Respuestas automaticas a resenas" connected={integrations.google} />
              <IntegrationCard name="Claude AI (Anthropic)" icon="✦" description="Generacion de respuestas inteligentes" connected={integrations.ai} />
              <IntegrationCard name="Twilio (WhatsApp + SMS)" icon="💬" description="Chatbot y mensajeria" connected={integrations.twilio} />
              <IntegrationCard name="Resend (Email)" icon="📧" description="Secuencias de nurture y reportes" connected={integrations.resend} />
              <IntegrationCard name="Stripe (Pagos)" icon="💳" description="Facturacion a clientes" connected={integrations.stripe} />
              <IntegrationCard name="Supabase (Base de datos)" icon="⚡" description="Almacenamiento y autenticacion" connected={integrations.supabase} />
            </div>
          </>
        )}

        {activeTab === 'Migracion' && (
          <MigrationTab
            ghlApiKey={ghlApiKey}
            setGhlApiKey={setGhlApiKey}
            migrating={migrating}
            setMigrating={setMigrating}
            migrationResult={migrationResult}
            setMigrationResult={setMigrationResult}
            migrationError={migrationError}
            setMigrationError={setMigrationError}
          />
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Migration Tab
// =============================================================================

function MigrationTab({
  ghlApiKey, setGhlApiKey, migrating, setMigrating,
  migrationResult, setMigrationResult, migrationError, setMigrationError,
}: {
  ghlApiKey: string
  setGhlApiKey: (v: string) => void
  migrating: boolean
  setMigrating: (v: boolean) => void
  migrationResult: {
    imported: number
    skipped: number
    locations: Array<{ name: string; status: 'imported' | 'skipped'; ghl_id: string }>
  } | null
  setMigrationResult: (v: {
    imported: number
    skipped: number
    locations: Array<{ name: string; status: 'imported' | 'skipped'; ghl_id: string }>
  } | null) => void
  migrationError: string
  setMigrationError: (v: string) => void
}) {
  const handleMigrate = async () => {
    if (!ghlApiKey.trim()) return
    setMigrating(true)
    setMigrationResult(null)
    setMigrationError('')

    try {
      const res = await fetch('/api/migrate/ghl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ghlApiKey: ghlApiKey.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMigrationError(data.error || 'Error al importar')
      } else {
        setMigrationResult(data)
      }
    } catch {
      setMigrationError('Error de conexion. Intenta de nuevo.')
    } finally {
      setMigrating(false)
    }
  }

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        Importar desde GoHighLevel
      </h1>
      <p style={{ fontSize: 13, color: '#6b6b8a', marginBottom: 28 }}>
        Importa tus clientes (locations) de GHL a Skala automaticamente.
        Solo se importan ubicaciones &mdash; contactos y conversaciones no estan disponibles por limitaciones de scope del API.
      </p>

      {/* API Key input */}
      <div style={{
        background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '24px 28px', maxWidth: 600, marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff2ea8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#e8e8f0' }}>Conexion GHL</span>
        </div>

        <label style={{ display: 'block', fontSize: 12, color: '#9090b0', marginBottom: 6 }}>
          Private Integration Token (API Key)
        </label>
        <input
          type="password"
          value={ghlApiKey}
          onChange={(e) => setGhlApiKey(e.target.value)}
          placeholder="pit-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14, color: '#e8e8f0',
            background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
            boxSizing: 'border-box', outline: 'none', marginBottom: 16,
            fontFamily: 'var(--font-dm-mono), monospace',
          }}
        />

        <button
          onClick={handleMigrate}
          disabled={migrating || !ghlApiKey.trim()}
          style={{
            padding: '10px 28px', borderRadius: 8, border: 'none',
            cursor: migrating || !ghlApiKey.trim() ? 'not-allowed' : 'pointer',
            background: migrating ? '#3b3b5c' : 'linear-gradient(135deg,#ff2ea8,#7c3aed)',
            color: '#fff', fontSize: 13, fontWeight: 600,
            opacity: !ghlApiKey.trim() ? 0.5 : 1,
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
        >
          {migrating ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Importando...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Importar
            </>
          )}
        </button>
      </div>

      {/* Spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Error */}
      {migrationError && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '16px 20px', maxWidth: 600, marginBottom: 20,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span style={{ fontSize: 13, color: '#ef4444' }}>{migrationError}</span>
        </div>
      )}

      {/* Results */}
      {migrationResult && (
        <div style={{ maxWidth: 600 }}>
          {/* Summary */}
          <div style={{
            display: 'flex', gap: 16, marginBottom: 20,
          }}>
            <div style={{
              flex: 1, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 10, padding: '16px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-dm-mono), monospace' }}>
                {migrationResult.imported}
              </div>
              <div style={{ fontSize: 12, color: '#6b6b8a', marginTop: 4 }}>Importados</div>
            </div>
            <div style={{
              flex: 1, background: 'rgba(107,107,138,0.1)', border: '1px solid rgba(107,107,138,0.2)',
              borderRadius: 10, padding: '16px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#9090b0', fontFamily: 'var(--font-dm-mono), monospace' }}>
                {migrationResult.skipped}
              </div>
              <div style={{ fontSize: 12, color: '#6b6b8a', marginTop: 4 }}>Omitidos</div>
            </div>
          </div>

          {/* Location list */}
          <div style={{
            background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: 12, color: '#6b6b8a', fontWeight: 600 }}>
              UBICACIONES ({migrationResult.locations.length})
            </div>
            {migrationResult.locations.map((loc) => (
              <div
                key={loc.ghl_id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {loc.status === 'imported' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b6b8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                )}
                <span style={{ fontSize: 13, color: loc.status === 'imported' ? '#e8e8f0' : '#6b6b8a', flex: 1 }}>
                  {loc.name}
                </span>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 4,
                  background: loc.status === 'imported' ? 'rgba(16,185,129,0.15)' : 'rgba(107,107,138,0.15)',
                  color: loc.status === 'imported' ? '#10b981' : '#6b6b8a',
                }}>
                  {loc.status === 'imported' ? 'Importado' : 'Omitido'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
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
