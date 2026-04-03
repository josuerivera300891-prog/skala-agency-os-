'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const VERTICALS = [
  { value: 'clinica', label: 'Clinica / Salud' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'barberia', label: 'Barberia / Salon' },
  { value: 'gimnasio', label: 'Gimnasio / Fitness' },
  { value: 'retail', label: 'Retail / Tienda' },
  { value: 'hotel', label: 'Hotel / Hospedaje' },
  { value: 'servicios', label: 'Servicios profesionales' },
  { value: 'otro', label: 'Otro' },
]

export default function NewClientPage() {
  const [name, setName] = useState('')
  const [vertical, setVertical] = useState('clinica')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [domain, setDomain] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [services, setServices] = useState('')
  const [hours, setHours] = useState('Lun-Sab 9am-6pm')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No autenticado'); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) { setError('Sin agencia asignada'); setLoading(false); return }

    const { data: client, error: insertError } = await supabase
      .from('clients')
      .insert({
        agency_id: profile.agency_id,
        name,
        vertical,
        email: email || null,
        phone: phone || null,
        domain: domain || null,
        active: true,
        config: {
          owner_phone: ownerPhone || null,
          services: services ? services.split(',').map((s) => s.trim()) : [],
          hours: hours || null,
        },
      })
      .select('id')
      .single()

    if (insertError || !client) {
      setError('Error al crear cliente: ' + (insertError?.message ?? ''))
      setLoading(false)
      return
    }

    router.push(`/clients/${client.id}`)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 600 }}>
        <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Agregar cliente
        </h1>
        <p style={{ fontSize: 13, color: '#6b6b8a', marginBottom: 28 }}>
          Registra un nuevo negocio para gestionar desde Skala
        </p>

        <form onSubmit={handleSubmit}>
          <Field label="Nombre del negocio *" value={name} onChange={setName} placeholder="Ej: Miami Grill, Elite Barbers, FitZone Gym" required />

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#9090b0', marginBottom: 6 }}>Tipo de negocio *</label>
            <select
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14, color: '#e8e8f0',
                background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
                boxSizing: 'border-box', outline: 'none',
              }}
            >
              {VERTICALS.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Email del negocio" value={email} onChange={setEmail} placeholder="contacto@negocio.com" type="email" />
            <Field label="Telefono del negocio" value={phone} onChange={setPhone} placeholder="+1 305 123 4567" />
          </div>

          <Field label="Sitio web" value={domain} onChange={setDomain} placeholder="https://www.negocio.com" />

          <Field label="Telefono del dueno (para alertas SMS)" value={ownerPhone} onChange={setOwnerPhone} placeholder="+1 305 999 8888" />

          <Field label="Servicios (separados por coma)" value={services} onChange={setServices} placeholder="Ej: Corte de pelo, Manicure, Consulta, Clase grupal" />

          <Field label="Horario de atencion" value={hours} onChange={setHours} placeholder="Lun-Sab 9am-6pm" />

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="submit"
              disabled={loading || !name}
              style={{
                padding: '12px 28px', borderRadius: 10, border: 'none', cursor: loading ? 'wait' : 'pointer',
                background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff',
                fontSize: 14, fontWeight: 600, opacity: loading || !name ? 0.5 : 1,
              }}
            >
              {loading ? 'Creando...' : 'Crear cliente'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/clients')}
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
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, color: '#9090b0', marginBottom: 6 }}>{label}</label>
      <input
        type={type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14, color: '#e8e8f0',
          background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
          boxSizing: 'border-box', outline: 'none',
        }}
      />
    </div>
  )
}
