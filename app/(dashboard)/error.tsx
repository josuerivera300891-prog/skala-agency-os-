'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0f', gap: 20, padding: 40,
    }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <h2 style={{
        fontFamily: 'var(--font-syne), Syne, sans-serif',
        fontSize: 18, fontWeight: 600, color: '#ef4444',
      }}>
        Algo salio mal
      </h2>
      <p style={{ fontSize: 13, color: '#6b6b8a', textAlign: 'center', maxWidth: 400 }}>
        Hubo un error al cargar esta pagina. Intenta de nuevo o vuelve al dashboard.
      </p>
      {error.digest && (
        <code style={{ fontSize: 11, color: '#6b6b8a', fontFamily: 'DM Mono, monospace' }}>
          Error: {error.digest}
        </code>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={reset}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff',
            fontSize: 13, fontWeight: 500,
          }}
        >
          Intentar de nuevo
        </button>
        <a href="/dashboard" style={{
          padding: '10px 20px', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)', color: '#9090b0',
          fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center',
        }}>
          Ir al dashboard
        </a>
      </div>
    </div>
  )
}
