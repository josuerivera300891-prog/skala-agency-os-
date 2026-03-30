'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterClientPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    // 1. Buscar cliente por invite code (usamos el client_id como código de invitación)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, agency_id, name')
      .eq('id', inviteCode)
      .single()

    if (clientError || !client) {
      setError('Código de invitación inválido. Contacta a tu agencia.')
      setLoading(false)
      return
    }

    // 2. Crear usuario
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Error al crear cuenta')
      setLoading(false)
      return
    }

    // 3. Vincular profile con client
    await supabase
      .from('profiles')
      .update({
        agency_id: client.agency_id,
        client_id: client.id,
        role: 'client',
        full_name: fullName,
      })
      .eq('id', authData.user.id)

    router.push(`/portal/${client.id}`)
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8, color: '#e8e8f0' }}>
        Acceso de cliente
      </h2>
      <p style={{ textAlign: 'center', fontSize: 13, color: '#6b6b8a', marginBottom: 24 }}>
        Tu agencia te dará el código de acceso
      </p>

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#9090b0', marginBottom: 6 }}>Código de invitación</label>
          <input
            type="text" required value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Código proporcionado por tu agencia"
            style={{ ...inputStyle, fontFamily: 'var(--font-dm-mono), DM Mono, monospace', fontSize: 13 }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#9090b0', marginBottom: 6 }}>Tu nombre</label>
          <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. María Pérez" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#9090b0', marginBottom: 6 }}>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#9090b0', marginBottom: 6 }}>Contraseña</label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 caracteres" style={inputStyle} />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: loading ? 'wait' : 'pointer',
          background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff',
          fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Creando...' : 'Acceder como cliente'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6b6b8a' }}>
        <Link href="/login" style={{ color: '#7c3aed', textDecoration: 'none' }}>Ya tengo cuenta</Link>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 8, fontSize: 14, color: '#e8e8f0',
  background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)',
  boxSizing: 'border-box', outline: 'none',
}
