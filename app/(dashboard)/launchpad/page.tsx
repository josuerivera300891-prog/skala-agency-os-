const CATEGORIES = [
  { name: 'Foundational Setup', icon: '🔧', active: true },
  { name: 'Marketing & Lead Generation', icon: '📣', active: false },
  { name: 'Sales & Conversations', icon: '💬', active: false },
  { name: 'Website & Monetisation', icon: '🌐', active: false },
  { name: 'Ecommerce', icon: '🛒', active: false },
]

const STEPS = [
  { title: 'Create a New Contacto', desc: 'Add your first contacto effortlessly and begin building meaningful engagement right away.', done: true },
  { title: 'Import and engage with all your contactos instantly', desc: 'Import your existing contactos from various platforms and start engaging with them immediately.', done: true },
  { title: 'Generate New Leads with a High-Converting Funnel', desc: 'Set up a high-converting funnel and form to capture leads efficiently.', done: true },
  { title: 'Set Up Multi-Channel Communication & Start Engaging in Minutes', desc: 'Connect your email, SMS, and phone services in minutes and start multi-channel engagement quickly.', done: true },
  { title: 'Launch Your First Campaign to Drive Engagement', desc: 'Design and send your first email campaign to engage over 1,000 contactos.', done: true },
  { title: 'Nurture Leads with Automated Drip Campaigns', desc: 'Set up automated email and SMS drip campaigns to nurture 100+ leads over time.', done: true },
  { title: 'Book More Appointments with Automated Scheduling', desc: 'Set up your calendar for automatic appointment bookings. Secure 20 appointments in the first week.', done: true },
]

export default function LaunchpadPage() {
  const completedCount = STEPS.filter((s) => s.done).length
  const progress = Math.round((completedCount / STEPS.length) * 100)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Guía de configuración
      </h1>
      <p style={{ fontSize: 14, color: '#9090b0', marginBottom: 28 }}>
        Hola Jossue, aquí tiene su lista de configuración personalizada con todo lo que necesita para empezar.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32 }}>
        {/* Left: Categories */}
        <div>
          {CATEGORIES.map((cat) => (
            <div key={cat.name} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 10, marginBottom: 4, cursor: 'pointer',
              background: cat.active ? 'rgba(59,130,246,0.1)' : 'transparent',
              border: cat.active ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
              color: cat.active ? '#3b82f6' : '#9090b0',
              fontSize: 14, fontWeight: cat.active ? 500 : 400,
            }}>
              <span style={{ fontSize: 18 }}>{cat.icon}</span>
              {cat.name}
            </div>
          ))}
        </div>

        {/* Right: Progress + steps */}
        <div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#9090b0' }}>Su progreso de Foundational Setup.</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{progress}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`, height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #7c3aed)',
                borderRadius: 4, transition: 'width 0.3s',
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '18px 20px',
                background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: i === 0 ? '12px 12px 2px 2px' : i === STEPS.length - 1 ? '2px 2px 12px 12px' : '2px',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: '#14141f', border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: '#6b6b8a',
                }}>
                  {step.done ? '👤' : (i + 1)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#e8e8f0', marginBottom: 2 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: '#6b6b8a', lineHeight: 1.5 }}>{step.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {step.done && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, color: '#10b981',
                    }}>
                      ✓ 100%
                    </span>
                  )}
                  <span style={{ fontSize: 16, color: '#6b6b8a' }}>▾</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
