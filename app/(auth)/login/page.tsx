'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Verificar rol para redirigir correctamente
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Error obteniendo usuario'); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, agency_id, client_id')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'client' && profile.client_id) {
      router.push(`/portal/${profile.client_id}`)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8, color: '#e8e8f0' }}>
        Iniciar sesión
      </h2>
      <p style={{ textAlign: 'center', fontSize: 13, color: '#6b6b8a', marginBottom: 24 }}>
        Ingresa a tu cuenta de agencia o cliente
      </p>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#9090b0', marginBottom: 6 }}>Email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#9090b0', marginBottom: 6 }}>Contraseña</label>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: loading ? 'wait' : 'pointer',
          background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff',
          fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6b6b8a' }}>
        <Link href="/register" style={{ color: '#7c3aed', textDecoration: 'none' }}>Crear cuenta de agencia</Link>
        <span style={{ margin: '0 8px' }}>·</span>
        <Link href="/register/client" style={{ color: '#3b82f6', textDecoration: 'none' }}>Acceso de cliente</Link>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 8, fontSize: 14, color: '#e8e8f0',
  background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)',
  boxSizing: 'border-box', outline: 'none',
}
