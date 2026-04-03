'use client'

import { useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DomainSearchResult {
  domain: string
  available: boolean
  price?: number
}

interface RegisteredDomain {
  domain: string
  status: string
  expires_at: string
  auto_renew: boolean
}

interface DnsRecord {
  id: string
  type: string
  name: string
  content: string
  proxied: boolean
  ttl: number
}

type Tab = 'search' | 'domains' | 'dns'

const DNS_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT'] as const

// ---------------------------------------------------------------------------
// Shared inline styles (matching contacts page pattern)
// ---------------------------------------------------------------------------
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13, color: '#e8e8f0',
  background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
  boxSizing: 'border-box', outline: 'none',
}

const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'auto' as unknown as undefined }

const btnPrimary: React.CSSProperties = {
  padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff',
  fontSize: 13, fontWeight: 600,
}

const btnGhost: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
  color: '#9090b0', fontSize: 13,
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function SitesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('search')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DomainSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Register state
  const [registeringDomain, setRegisteringDomain] = useState<string | null>(null)
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [registerError, setRegisterError] = useState('')

  // My domains state
  const [domains, setDomains] = useState<RegisteredDomain[]>([])
  const [domainsLoading, setDomainsLoading] = useState(false)
  const [domainsError, setDomainsError] = useState('')

  // DNS state
  const [selectedDomain, setSelectedDomain] = useState('')
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([])
  const [dnsLoading, setDnsLoading] = useState(false)
  const [dnsError, setDnsError] = useState('')
  const [showDnsForm, setShowDnsForm] = useState(false)
  const [dnsFormType, setDnsFormType] = useState<string>('A')
  const [dnsFormName, setDnsFormName] = useState('')
  const [dnsFormContent, setDnsFormContent] = useState('')
  const [dnsFormProxied, setDnsFormProxied] = useState(false)
  const [dnsFormSaving, setDnsFormSaving] = useState(false)

  // -------------------------------------------------------------------------
  // Search domains
  // -------------------------------------------------------------------------
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchError('')
    setSearchResults([])
    setRegisterSuccess('')
    setRegisterError('')

    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query: searchQuery.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSearchError(data.error ?? 'Error al buscar dominios')
      } else {
        setSearchResults(data.results ?? [])
      }
    } catch {
      setSearchError('Error de conexion')
    } finally {
      setSearching(false)
    }
  }

  // -------------------------------------------------------------------------
  // Register domain
  // -------------------------------------------------------------------------
  const handleRegister = async (domain: string) => {
    setRegisteringDomain(domain)
    setRegisterError('')
    setRegisterSuccess('')

    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', domain }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRegisterError(data.error ?? 'Error al registrar dominio')
      } else {
        setRegisterSuccess(`Dominio ${data.domain} registrado exitosamente`)
      }
    } catch {
      setRegisterError('Error de conexion')
    } finally {
      setRegisteringDomain(null)
    }
  }

  // -------------------------------------------------------------------------
  // Load my domains
  // -------------------------------------------------------------------------
  const loadDomains = useCallback(async () => {
    setDomainsLoading(true)
    setDomainsError('')

    try {
      const res = await fetch('/api/domains')
      const data = await res.json()
      if (!res.ok) {
        setDomainsError(data.error ?? 'Error al cargar dominios')
      } else {
        setDomains(data.domains ?? [])
      }
    } catch {
      setDomainsError('Error de conexion')
    } finally {
      setDomainsLoading(false)
    }
  }, [])

  // -------------------------------------------------------------------------
  // Load DNS records
  // -------------------------------------------------------------------------
  const loadDnsRecords = useCallback(async (domain: string) => {
    setDnsLoading(true)
    setDnsError('')

    try {
      const res = await fetch(`/api/domains/dns?domain=${encodeURIComponent(domain)}`)
      const data = await res.json()
      if (!res.ok) {
        setDnsError(data.error ?? 'Error al cargar registros DNS')
      } else {
        setDnsRecords(data.records ?? [])
      }
    } catch {
      setDnsError('Error de conexion')
    } finally {
      setDnsLoading(false)
    }
  }, [])

  // -------------------------------------------------------------------------
  // Add DNS record
  // -------------------------------------------------------------------------
  const handleAddDns = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDomain || !dnsFormName.trim() || !dnsFormContent.trim()) return
    setDnsFormSaving(true)
    setDnsError('')

    try {
      const res = await fetch('/api/domains/dns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: selectedDomain,
          type: dnsFormType,
          name: dnsFormName.trim(),
          content: dnsFormContent.trim(),
          proxied: dnsFormProxied,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setDnsError(data.error ?? 'Error al agregar registro')
      } else {
        setDnsFormName('')
        setDnsFormContent('')
        setDnsFormProxied(false)
        setDnsFormType('A')
        setShowDnsForm(false)
        await loadDnsRecords(selectedDomain)
      }
    } catch {
      setDnsError('Error de conexion')
    } finally {
      setDnsFormSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Tab switching
  // -------------------------------------------------------------------------
  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'domains') {
      loadDomains()
    }
  }

  const openDns = (domain: string) => {
    setSelectedDomain(domain)
    setActiveTab('dns')
    loadDnsRecords(domain)
  }

  // -------------------------------------------------------------------------
  // Tab pill style helper
  // -------------------------------------------------------------------------
  const tabStyle = (tab: Tab): React.CSSProperties => ({
    padding: '6px 16px', borderRadius: 6, fontSize: 12,
    fontWeight: 500, cursor: 'pointer',
    background: activeTab === tab ? 'rgba(255,46,168,0.15)' : 'rgba(255,255,255,0.03)',
    color: activeTab === tab ? '#ff2ea8' : '#6b6b8a',
    border: activeTab === tab ? '1px solid rgba(255,46,168,0.3)' : '1px solid rgba(255,255,255,0.05)',
  })

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, margin: 0, color: '#e8e8f0' }}>
              Dominios
            </h1>
            <p style={{ fontSize: 12, color: '#6b6b8a', margin: '4px 0 0', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
              Buscar, comprar y administrar dominios
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => switchTab('search')} style={tabStyle('search')}>
            Buscar Dominio
          </button>
          <button onClick={() => switchTab('domains')} style={tabStyle('domains')}>
            Mis Dominios
          </button>
          {selectedDomain && (
            <button onClick={() => switchTab('dns')} style={tabStyle('dns')}>
              DNS: {selectedDomain}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>

        {/* ============================================================= */}
        {/* TAB 1: Search */}
        {/* ============================================================= */}
        {activeTab === 'search' && (
          <div>
            {/* Search form */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar disponibilidad de dominio..."
                style={{
                  flex: 1, padding: '14px 18px', borderRadius: 10, fontSize: 15, color: '#e8e8f0',
                  background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
                  boxSizing: 'border-box', outline: 'none',
                  fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
                }}
              />
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                style={{ ...btnPrimary, padding: '14px 28px', fontSize: 14, opacity: searching || !searchQuery.trim() ? 0.5 : 1 }}
              >
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </form>

            {/* Messages */}
            {searchError && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontSize: 13,
              }}>
                {searchError}
              </div>
            )}
            {registerSuccess && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                color: '#10b981', fontSize: 13,
              }}>
                {registerSuccess}
              </div>
            )}
            {registerError && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontSize: 13,
              }}>
                {registerError}
              </div>
            )}

            {/* Search results */}
            {searching && (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b6b8a', fontSize: 13 }}>
                Buscando disponibilidad...
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <div style={{ display: 'grid', gap: 12 }}>
                {searchResults.map((result) => (
                  <div
                    key={result.domain}
                    style={{
                      background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12, padding: '16px 20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{
                        fontSize: 15, fontWeight: 600, color: '#e8e8f0',
                        fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
                      }}>
                        {result.domain}
                      </span>
                      <span style={{
                        padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: result.available ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: result.available ? '#10b981' : '#ef4444',
                      }}>
                        {result.available ? 'Disponible' : 'No disponible'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {result.price != null && (
                        <span style={{
                          fontSize: 14, fontWeight: 600, color: '#a78bfa',
                          fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
                        }}>
                          ${result.price}/ano
                        </span>
                      )}
                      {result.available && (
                        <button
                          onClick={() => handleRegister(result.domain)}
                          disabled={registeringDomain === result.domain}
                          style={{
                            ...btnPrimary,
                            padding: '8px 18px',
                            opacity: registeringDomain === result.domain ? 0.5 : 1,
                          }}
                        >
                          {registeringDomain === result.domain ? 'Comprando...' : 'Comprar'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!searching && searchResults.length === 0 && !searchError && searchQuery === '' && (
              <div style={{
                background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '60px 32px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.6 }}>
                  {'\uD83C\uDF10'}
                </div>
                <p style={{ fontSize: 14, color: '#6b6b8a', margin: 0 }}>
                  Escribe un nombre de dominio para buscar disponibilidad
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: My Domains */}
        {/* ============================================================= */}
        {activeTab === 'domains' && (
          <div>
            {domainsError && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontSize: 13,
              }}>
                {domainsError}
              </div>
            )}

            {domainsLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b6b8a', fontSize: 13 }}>
                Cargando dominios...
              </div>
            ) : (
              <div style={{
                background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                {/* Table header */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 140px 100px 80px',
                  padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
                  fontSize: 11, color: '#6b6b8a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  <span>Dominio</span>
                  <span>Estado</span>
                  <span>Expira</span>
                  <span>Auto-renew</span>
                  <span>DNS</span>
                </div>

                {/* Rows */}
                {domains.map((d, i) => {
                  const isActive = d.status === 'active'
                  return (
                    <div
                      key={d.domain}
                      style={{
                        display: 'grid', gridTemplateColumns: '1fr 100px 140px 100px 80px',
                        padding: '14px 16px', alignItems: 'center',
                        borderBottom: i < domains.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        fontSize: 13, color: '#e8e8f0',
                      }}
                    >
                      <span style={{ fontWeight: 500, fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
                        {d.domain}
                      </span>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                        display: 'inline-block', width: 'fit-content', textTransform: 'capitalize',
                        background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: isActive ? '#10b981' : '#f59e0b',
                      }}>
                        {d.status}
                      </span>
                      <span style={{ fontSize: 12, color: '#9090b0', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
                        {new Date(d.expires_at).toLocaleDateString('es-US', { year: 'numeric', month: 'short', day: '2-digit' })}
                      </span>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                        display: 'inline-block', width: 'fit-content',
                        background: d.auto_renew ? 'rgba(16,185,129,0.1)' : 'rgba(107,107,138,0.1)',
                        color: d.auto_renew ? '#10b981' : '#6b6b8a',
                      }}>
                        {d.auto_renew ? 'Si' : 'No'}
                      </span>
                      <button
                        onClick={() => openDns(d.domain)}
                        style={{ ...btnGhost, padding: '5px 12px', fontSize: 11 }}
                      >
                        DNS
                      </button>
                    </div>
                  )
                })}

                {domains.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: '#6b6b8a', fontSize: 13 }}>
                    No tienes dominios registrados
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: DNS */}
        {/* ============================================================= */}
        {activeTab === 'dns' && selectedDomain && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 17, fontWeight: 600,
                  margin: 0, color: '#e8e8f0',
                }}>
                  Registros DNS
                </h2>
                <p style={{
                  fontSize: 12, color: '#6b6b8a', margin: '4px 0 0',
                  fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
                }}>
                  {selectedDomain}
                </p>
              </div>
              <button onClick={() => setShowDnsForm(!showDnsForm)} style={btnPrimary}>
                + Agregar registro
              </button>
            </div>

            {/* Add DNS form */}
            {showDnsForm && (
              <div style={{
                background: 'rgba(20,20,31,0.6)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: 16, marginBottom: 16,
              }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#e8e8f0' }}>
                  Agregar registro DNS
                </h3>
                <form onSubmit={handleAddDns}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr auto', gap: 12, marginBottom: 12, alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#9090b0', marginBottom: 4 }}>Tipo</label>
                      <select value={dnsFormType} onChange={(e) => setDnsFormType(e.target.value)} style={selectStyle}>
                        {DNS_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#9090b0', marginBottom: 4 }}>Nombre</label>
                      <input
                        value={dnsFormName}
                        onChange={(e) => setDnsFormName(e.target.value)}
                        placeholder="@ o subdominio"
                        required
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#9090b0', marginBottom: 4 }}>Contenido</label>
                      <input
                        value={dnsFormContent}
                        onChange={(e) => setDnsFormContent(e.target.value)}
                        placeholder="IP o valor"
                        required
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 2 }}>
                      <input
                        type="checkbox"
                        checked={dnsFormProxied}
                        onChange={(e) => setDnsFormProxied(e.target.checked)}
                        id="dns-proxied"
                        style={{ accentColor: '#7c3aed' }}
                      />
                      <label htmlFor="dns-proxied" style={{ fontSize: 12, color: '#9090b0', cursor: 'pointer' }}>
                        Proxied
                      </label>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="submit"
                      disabled={dnsFormSaving || !dnsFormName.trim() || !dnsFormContent.trim()}
                      style={{ ...btnPrimary, opacity: dnsFormSaving ? 0.5 : 1 }}
                    >
                      {dnsFormSaving ? 'Guardando...' : 'Agregar'}
                    </button>
                    <button type="button" onClick={() => setShowDnsForm(false)} style={btnGhost}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* DNS error */}
            {dnsError && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontSize: 13,
              }}>
                {dnsError}
              </div>
            )}

            {/* DNS table */}
            {dnsLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b6b8a', fontSize: 13 }}>
                Cargando registros DNS...
              </div>
            ) : (
              <div style={{
                background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                {/* Table header */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr 1fr 80px 80px',
                  padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
                  fontSize: 11, color: '#6b6b8a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  <span>Tipo</span>
                  <span>Nombre</span>
                  <span>Contenido</span>
                  <span>Proxied</span>
                  <span>TTL</span>
                </div>

                {/* Rows */}
                {dnsRecords.map((r, i) => (
                  <div
                    key={r.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '80px 1fr 1fr 80px 80px',
                      padding: '12px 16px', alignItems: 'center',
                      borderBottom: i < dnsRecords.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      fontSize: 13, color: '#e8e8f0',
                    }}
                  >
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: 'rgba(124,58,237,0.15)', color: '#a78bfa',
                      display: 'inline-block', width: 'fit-content',
                      fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
                    }}>
                      {r.type}
                    </span>
                    <span style={{
                      fontSize: 12, color: '#9090b0',
                      fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {r.name}
                    </span>
                    <span style={{
                      fontSize: 12, color: '#9090b0',
                      fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {r.content}
                    </span>
                    <span style={{
                      fontSize: 11, color: r.proxied ? '#f59e0b' : '#6b6b8a',
                    }}>
                      {r.proxied ? 'Si' : 'No'}
                    </span>
                    <span style={{
                      fontSize: 11, color: '#6b6b8a',
                      fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
                    }}>
                      {r.ttl === 1 ? 'Auto' : `${r.ttl}s`}
                    </span>
                  </div>
                ))}

                {dnsRecords.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: '#6b6b8a', fontSize: 13 }}>
                    No hay registros DNS para este dominio
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
