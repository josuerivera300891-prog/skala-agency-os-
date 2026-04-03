'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Lead, LeadSource, LeadStatus } from '@/types'

const STATUS_OPTIONS: ('all' | LeadStatus)[] = ['all', 'new', 'contacted', 'nurture', 'appointment', 'closed', 'cold']
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new:         { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  contacted:   { bg: 'rgba(124,58,237,0.15)', color: '#7c3aed' },
  nurture:     { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  appointment: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  closed:      { bg: 'rgba(16,185,129,0.25)', color: '#10b981' },
  cold:        { bg: 'rgba(107,107,138,0.15)', color: '#6b6b8a' },
}

const SOURCE_ICONS: Record<string, string> = {
  whatsapp: '\u{1F4AC}',
  gmb_call: '\u{1F4DE}',
  web_form: '\u{1F310}',
  referral: '\u{1F91D}',
}

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'gmb_call', label: 'Llamada GMB' },
  { value: 'web_form', label: 'Formulario web' },
  { value: 'referral', label: 'Referido' },
]

const STATUS_LABELS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'Nuevo' },
  { value: 'contacted', label: 'Contactado' },
  { value: 'nurture', label: 'Nurture' },
  { value: 'appointment', label: 'Cita' },
  { value: 'closed', label: 'Cerrado' },
  { value: 'cold', label: 'Frio' },
]

type LeadWithClient = Lead & { clients?: { name: string } | null }
type ClientOption = { id: string; name: string }

// ---------------------------------------------------------------------------
// Shared inline styles
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

const btnDanger: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
  border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)',
  color: '#ef4444', fontSize: 12, fontWeight: 500,
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function ContactsPage() {
  const [leads, setLeads] = useState<LeadWithClient[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [opLoading, setOpLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formSource, setFormSource] = useState<LeadSource | ''>('')
  const [formClientId, setFormClientId] = useState('')
  const [formService, setFormService] = useState('')
  const [formStatus, setFormStatus] = useState<LeadStatus>('new')
  const [formNotes, setFormNotes] = useState('')

  // -------------------------------------------------------------------------
  // Load leads + clients
  // -------------------------------------------------------------------------
  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) { setLoading(false); return }

    // Load clients for the agency (for the dropdown + join names)
    const { data: agencyClients } = await supabase
      .from('clients')
      .select('id, name')
      .eq('agency_id', profile.agency_id)

    const clientList = (agencyClients ?? []) as ClientOption[]
    setClients(clientList)

    const clientIds = clientList.map((c) => c.id)
    if (clientIds.length === 0) { setLeads([]); setLoading(false); return }

    let query = supabase
      .from('leads')
      .select('*, clients(name)')
      .in('client_id', clientIds)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    }

    const { data: leadsData } = await query.limit(200)
    setLeads((leadsData as LeadWithClient[]) ?? [])
    setLoading(false)
  }, [statusFilter, searchQuery])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching effect, setState in async callback is standard
    loadData()
  }, [loadData])

  // -------------------------------------------------------------------------
  // Reset form
  // -------------------------------------------------------------------------
  const resetForm = () => {
    setFormName(''); setFormPhone(''); setFormEmail('')
    setFormSource(''); setFormClientId(''); setFormService('')
    setFormStatus('new'); setFormNotes('')
  }

  const openCreateForm = () => {
    resetForm()
    setEditingId(null)
    setShowForm(true)
    setError('')
  }

  const openEditForm = (lead: LeadWithClient) => {
    setFormName(lead.name)
    setFormPhone(lead.phone ?? '')
    setFormEmail(lead.email ?? '')
    setFormSource((lead.source as LeadSource) ?? '')
    setFormClientId(lead.client_id)
    setFormService(lead.service ?? '')
    setFormStatus(lead.status)
    setFormNotes(lead.notes ?? '')
    setEditingId(lead.id)
    setShowForm(true)
    setError('')
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    resetForm()
    setError('')
  }

  // -------------------------------------------------------------------------
  // Create / Update
  // -------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setOpLoading(true)

    const isEdit = !!editingId

    const body: Record<string, unknown> = isEdit
      ? {
          leadId: editingId,
          name: formName,
          phone: formPhone,
          email: formEmail,
          source: formSource || undefined,
          service: formService || undefined,
          status: formStatus,
          notes: formNotes || undefined,
        }
      : {
          name: formName,
          phone: formPhone,
          email: formEmail,
          client_id: formClientId,
          source: formSource || undefined,
          service: formService || undefined,
          status: formStatus,
          notes: formNotes || undefined,
        }

    const res = await fetch('/api/leads', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error desconocido')
      setOpLoading(false)
      return
    }

    closeForm()
    setOpLoading(false)
    await loadData()
  }

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  const handleDelete = async (leadId: string) => {
    setOpLoading(true)
    const res = await fetch('/api/leads', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al eliminar')
    }
    setDeletingId(null)
    setOpLoading(false)
    await loadData()
  }

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------
  const totalLeads = leads.length
  const newLeads = leads.filter((l) => l.status === 'new').length
  const appointments = leads.filter((l) => l.status === 'appointment').length

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, margin: 0 }}>
              Contactos
            </h1>
            <p style={{ fontSize: 12, color: '#6b6b8a', margin: '4px 0 0', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
              {totalLeads} contactos {'\u00B7'} {newLeads} nuevos {'\u00B7'} {appointments} con cita
            </p>
          </div>
          <button onClick={openCreateForm} style={btnPrimary}>
            + Agregar contacto
          </button>
        </div>

        {/* Search + Filters */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, telefono o email..."
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#e8e8f0',
              background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
              boxSizing: 'border-box', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 11,
                  textTransform: 'capitalize', fontWeight: 500, cursor: 'pointer',
                  background: statusFilter === s ? 'rgba(255,46,168,0.15)' : 'rgba(255,255,255,0.03)',
                  color: statusFilter === s ? '#ff2ea8' : '#6b6b8a',
                  border: statusFilter === s ? '1px solid rgba(255,46,168,0.3)' : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {s === 'all' ? 'Todos' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inline Create / Edit Form */}
      {showForm && (
        <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(20,20,31,0.6)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#e8e8f0' }}>
            {editingId ? 'Editar contacto' : 'Nuevo contacto'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#9090b0', marginBottom: 4 }}>Nombre *</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nombre completo" required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#9090b0', marginBottom: 4 }}>Telefono</label>
                <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+1 305 123 4567" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#9090b0', marginBottom: 4 }}>Email</label>
                <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@ejemplo.com" type="email" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              {!editingId && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#9090b0', marginBottom: 4 }}>Cliente *</label>
                  <select value={formClientId} onChange={(e) => setFormClientId(e.target.value)} required style={selectStyle}>
                    <option value="">Seleccionar...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#9090b0', marginBottom: 4 }}>Fuente</label>
                <select value={formSource} onChange={(e) => setFormSource(e.target.value as LeadSource | '')} style={selectStyle}>
                  <option value="">Sin fuente</option>
                  {SOURCE_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#9090b0', marginBottom: 4 }}>Servicio</label>
                <input value={formService} onChange={(e) => setFormService(e.target.value)} placeholder="Ej: Blanqueamiento" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#9090b0', marginBottom: 4 }}>Estado</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as LeadStatus)} style={selectStyle}>
                  {STATUS_LABELS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#9090b0', marginBottom: 4 }}>Notas</label>
              <input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Notas opcionales..." style={inputStyle} />
            </div>

            {error && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 12, marginBottom: 12 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={opLoading || !formName || (!editingId && !formClientId)} style={{ ...btnPrimary, opacity: opLoading ? 0.5 : 1 }}>
                {opLoading ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear contacto'}
              </button>
              <button type="button" onClick={closeForm} style={btnGhost}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 28px' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b6b8a', fontSize: 13 }}>Cargando contactos...</div>
        ) : (
          <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', marginTop: 20 }}>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 130px 160px 90px 90px 100px 60px',
              padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
              fontSize: 11, color: '#6b6b8a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              <span>Nombre</span>
              <span>Telefono</span>
              <span>Email</span>
              <span>Fuente</span>
              <span>Estado</span>
              <span>Fecha</span>
              <span></span>
            </div>

            {/* Rows */}
            {leads.map((lead, i) => {
              const st = STATUS_COLORS[lead.status] ?? STATUS_COLORS.cold
              return (
                <div key={lead.id}>
                  <div
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 130px 160px 90px 90px 100px 60px',
                      padding: '14px 16px', alignItems: 'center',
                      borderBottom: i < leads.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      fontSize: 13, color: '#e8e8f0',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{lead.name}</div>
                      <div style={{ fontSize: 11, color: '#6b6b8a' }}>{lead.clients?.name ?? ''}</div>
                    </div>
                    <span style={{ fontSize: 12, color: '#9090b0', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
                      {lead.phone ?? '\u2014'}
                    </span>
                    <span style={{ fontSize: 12, color: '#9090b0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.email ?? '\u2014'}
                    </span>
                    <span style={{ fontSize: 12 }}>
                      {(lead.source && SOURCE_ICONS[lead.source]) ?? '\u2022'} {lead.source ?? '\u2014'}
                    </span>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                      background: st.bg, color: st.color, textTransform: 'capitalize',
                      display: 'inline-block', width: 'fit-content',
                    }}>
                      {lead.status}
                    </span>
                    <span style={{ fontSize: 11, color: '#6b6b8a', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
                      {new Date(lead.created_at).toLocaleDateString('es-US', { month: 'short', day: '2-digit' })}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => openEditForm(lead)}
                        title="Editar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9090b0', fontSize: 14, padding: '2px 4px' }}
                      >
                        {'\u270E'}
                      </button>
                      <button
                        onClick={() => setDeletingId(lead.id)}
                        title="Eliminar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b8a', fontSize: 14, padding: '2px 4px' }}
                      >
                        {'\u2715'}
                      </button>
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {deletingId === lead.id && (
                    <div style={{
                      padding: '10px 16px', background: 'rgba(239,68,68,0.05)',
                      borderBottom: '1px solid rgba(239,68,68,0.15)',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <span style={{ fontSize: 12, color: '#ef4444' }}>Eliminar a {lead.name}?</span>
                      <button onClick={() => handleDelete(lead.id)} disabled={opLoading} style={btnDanger}>
                        {opLoading ? 'Eliminando...' : 'Si, eliminar'}
                      </button>
                      <button onClick={() => setDeletingId(null)} style={{ ...btnGhost, padding: '6px 14px', fontSize: 12 }}>
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {leads.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b6b8a', fontSize: 13 }}>
                {searchQuery || statusFilter !== 'all' ? 'No se encontraron contactos con esos filtros' : 'Sin contactos todavia'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
