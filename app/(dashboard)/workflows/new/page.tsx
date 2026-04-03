'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { WorkflowType } from '@/types'

const WORKFLOW_TYPES: { value: WorkflowType; label: string }[] = [
  { value: 'review_reply', label: 'Respuesta a resenas' },
  { value: 'lead_welcome', label: 'Bienvenida de lead' },
  { value: 'email_nurture', label: 'Email nurture' },
  { value: 'report', label: 'Reporte' },
  { value: 'chatbot', label: 'Chatbot' },
]

interface ClientOption {
  id: string
  name: string
}

export default function NewWorkflowPage() {
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState('')
  const [type, setType] = useState<WorkflowType>('review_reply')
  const [active, setActive] = useState(false)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingClients, setLoadingClients] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function fetchClients() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingClients(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', user.id)
        .single()

      if (!profile?.agency_id) { setLoadingClients(false); return }

      const { data } = await supabase
        .from('clients')
        .select('id, name')
        .eq('agency_id', profile.agency_id)
        .eq('active', true)
        .order('name')

      const clientList = (data ?? []) as ClientOption[]
      setClients(clientList)
      if (clientList.length > 0) setClientId(clientList[0].id)
      setLoadingClients(false)
    }
    fetchClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, client_id: clientId, type, active }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al crear workflow')
        setLoading(false)
        return
      }

      router.push(`/workflows/${data.workflow.id}`)
    } catch {
      setError('Error de red al crear workflow')
      setLoading(false)
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 600 }}>
        <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Crear flujo de trabajo
        </h1>
        <p style={{ fontSize: 13, color: '#6b6b8a', marginBottom: 28 }}>
          Configura un nuevo workflow de automatizacion para un cliente
        </p>

        {loadingClients ? (
          <div style={{ color: '#6b6b8a', fontSize: 13 }}>Cargando clientes...</div>
        ) : clients.length === 0 ? (
          <div style={{
            background: '#0f0f1a', border: '1px dashed rgba(124,58,237,0.4)',
            borderRadius: 12, padding: '32px 24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 14, color: '#e8e8f0', marginBottom: 12 }}>
              Necesitas al menos un cliente para crear un workflow.
            </p>
            <Link href="/clients/new" style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff',
              fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block',
            }}>
              + Agregar cliente
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#9090b0', marginBottom: 6 }}>Nombre del workflow *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Auto-reply resenas Clinica Vital"
                required
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14, color: '#e8e8f0',
                  background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
                  boxSizing: 'border-box', outline: 'none',
                }}
              />
            </div>

            {/* Client */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#9090b0', marginBottom: 6 }}>Cliente *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14, color: '#e8e8f0',
                  background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
                  boxSizing: 'border-box', outline: 'none',
                }}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#9090b0', marginBottom: 6 }}>Tipo de workflow *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as WorkflowType)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14, color: '#e8e8f0',
                  background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
                  boxSizing: 'border-box', outline: 'none',
                }}
              >
                {WORKFLOW_TYPES.map((wt) => (
                  <option key={wt.value} value={wt.value}>{wt.label}</option>
                ))}
              </select>
            </div>

            {/* Active toggle */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ fontSize: 12, color: '#9090b0' }}>Activar al crear</label>
              <button
                type="button"
                onClick={() => setActive(!active)}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: active ? 'linear-gradient(135deg,#ff2ea8,#7c3aed)' : '#2a2a3e',
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
              <span style={{ fontSize: 12, color: active ? '#10b981' : '#6b6b8a' }}>
                {active ? 'Activo' : 'Borrador'}
              </span>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontSize: 13, marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="submit"
                disabled={loading || !name || !clientId}
                style={{
                  padding: '12px 28px', borderRadius: 10, border: 'none', cursor: loading ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff',
                  fontSize: 14, fontWeight: 600, opacity: loading || !name || !clientId ? 0.5 : 1,
                }}
              >
                {loading ? 'Creando...' : 'Crear workflow'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/workflows')}
                style={{
                  padding: '12px 28px', borderRadius: 10, cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                  color: '#9090b0', fontSize: 14,
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
