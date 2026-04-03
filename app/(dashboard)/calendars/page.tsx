export const metadata = { title: 'Calendarios — Skala' }

export default function CalendarsPage() {
  return (
    <div style={{ padding: '32px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#e8e8f0',
          margin: 0,
          fontFamily: 'var(--font-syne), Syne, sans-serif',
        }}>
          📅 Calendarios
        </h1>
        <p style={{ fontSize: 13, color: '#6b6b8a', marginTop: 4 }}>
          Agenda de reuniones, citas y seguimientos
        </p>
      </div>

      <div style={{
        background: '#0f0f1a',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: '60px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
        <h2 style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#e8e8f0',
          margin: '0 0 8px',
          fontFamily: 'var(--font-syne), Syne, sans-serif',
        }}>
          Coming in v2
        </h2>
        <p style={{ fontSize: 13, color: '#6b6b8a', maxWidth: 400, margin: '0 auto' }}>
          Mientras tanto, usa Cal.com o Calendly para agendar citas.
        </p>
        <a
          href="#"
          style={{
            display: 'inline-block',
            marginTop: 20,
            padding: '8px 18px',
            borderRadius: 8,
            background: 'rgba(59,130,246,0.12)',
            color: '#60a5fa',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Abrir enlace de reservas externo
        </a>
        <div style={{
          marginTop: 16,
          display: 'inline-block',
          padding: '6px 14px',
          borderRadius: 20,
          background: 'rgba(124,58,237,0.12)',
          color: '#a78bfa',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
        }}>
          COMING IN V2
        </div>
      </div>
    </div>
  )
}
