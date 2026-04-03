'use client'

import { useState } from 'react'
import type { Client } from '@/types'

const VERTICALS = ['restaurante', 'clinica', 'barberia', 'gimnasio', 'retail', 'hotel'] as const

interface Props {
  client: Client
}

export default function ClientEditPanel({ client }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState(client.name)
  const [vertical, setVertical] = useState(client.vertical)
  const [email, setEmail] = useState(client.email ?? '')
  const [phone, setPhone] = useState(client.phone ?? '')
  const [domain, setDomain] = useState(client.domain ?? '')
  const [active, setActive] = useState(client.active)

  function handleCancel() {
    setName(client.name)
    setVertical(client.vertical)
    setEmail(client.email ?? '')
    setPhone(client.phone ?? '')
    setDomain(client.domain ?? '')
    setActive(client.active)
    setEditing(false)
    setError(null)
    setSuccess(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: client.id,
          name,
          vertical,
          email: email || undefined,
          phone: phone || undefined,
          domain: domain || undefined,
          active,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error al guardar')
      }

      setSuccess(true)
      setEditing(false)
      // Reload the page to show updated data from the server
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 13,
    color: '#e8e8f0',
    background: '#14141f',
    border: '1px solid rgba(255,255,255,0.1)',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#6b6b8a',
    marginBottom: 4,
    display: 'block',
    fontFamily: 'DM Mono, monospace',
  }

  if (!editing) {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setEditing(true)}
          style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            background: 'rgba(124,58,237,0.15)', color: '#7c3aed',
            border: '1px solid rgba(124,58,237,0.3)', cursor: 'pointer',
          }}
        >
          Editar
        </button>
      </div>
    )
  }

  return (
    <div style={{
      background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '24px 28px', marginBottom: 24,
    }}>
      <h3 style={{
        fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600,
        marginBottom: 16, color: '#e8e8f0',
      }}>
        Editar cliente
      </h3>

      {error && (
        <div style={{
          padding: '8px 14px', borderRadius: 8, fontSize: 12,
          background: 'rgba(239,68,68,0.1)', color: '#ef4444',
          border: '1px solid rgba(239,68,68,0.3)', marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '8px 14px', borderRadius: 8, fontSize: 12,
          background: 'rgba(16,185,129,0.1)', color: '#10b981',
          border: '1px solid rgba(16,185,129,0.3)', marginBottom: 16,
        }}>
          Guardado correctamente
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Nombre</label>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Vertical</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={vertical}
            onChange={(e) => setVertical(e.target.value as Client['vertical'])}
          >
            {VERTICALS.map((v) => (
              <option key={v} value={v} style={{ background: '#14141f' }}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@ejemplo.com" />
        </div>
        <div>
          <label style={labelStyle}>Telefono</label>
          <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1305..." />
        </div>
        <div>
          <label style={labelStyle}>Dominio</label>
          <input style={inputStyle} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="ejemplo.com" />
        </div>
        <div>
          <label style={labelStyle}>Estado</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
            <button
              onClick={() => setActive(!active)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: active ? '#10b981' : '#374151',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3,
                left: active ? 23 : 3,
                transition: 'left 0.2s',
              }} />
            </button>
            <span style={{ fontSize: 12, color: active ? '#10b981' : '#6b7280' }}>
              {active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={handleCancel}
          disabled={saving}
          style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            background: 'transparent', color: '#9090b0',
            border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff',
            border: 'none', cursor: 'pointer',
            opacity: saving || !name.trim() ? 0.5 : 1,
          }}
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
