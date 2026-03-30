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
          Próximamente
        </h2>
        <p style={{ fontSize: 13, color: '#6b6b8a', maxWidth: 400, margin: '0 auto' }}>
          Calendario integrado para agendar reuniones con clientes, follow-ups automáticos y sincronización con Google Calendar.
        </p>
        <div style={{
          marginTop: 20,
          display: 'inline-block',
          padding: '6px 14px',
          borderRadius: 20,
          background: 'rgba(124,58,237,0.12)',
          color: '#a78bfa',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
        }}>
          EN DESARROLLO
        </div>
      </div>
    </div>
  )
}
