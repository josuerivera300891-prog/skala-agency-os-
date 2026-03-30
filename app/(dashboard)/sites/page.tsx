import Link from 'next/link'

const TABS = ['Embudos', 'Sitios web', 'Tiendas', 'Seminarios web', 'SEO', 'Analytics', 'Blogs', 'WordPress', 'Portal del cliente', 'Formularios', 'Encuestas', 'Cuestionarios', 'Widget de chat', 'Códigos QR']

const FUNNELS = [
  { name: 'Insurance Website', updated: 'Aug 27, 2025 01:30 PM', funnels: '1 Embudo', folder: true },
  { name: 'Insurance Website', updated: 'Aug 27, 2025 04:57 PM', funnels: '1 Embudo', folder: true },
  { name: 'Real Estate Funnel', updated: 'Aug 27, 2025 01:30 PM', funnels: '1 Embudo', folder: true },
  { name: 'Real Estate Funnel', updated: 'Aug 27, 2025 04:57 PM', funnels: '1 Embudo', folder: true },
  { name: 'Roofing Contractor', updated: 'Aug 27, 2025 04:57 PM', funnels: '1 Embudo', folder: true },
  { name: 'Thinkrr Demo Funnel', updated: 'Aug 27, 2025 04:57 PM', funnels: '1 Embudo', folder: true },
  { name: 'Agency Funnel (Gradient) Copy', updated: 'Jul 07, 2025 10:58 AM', funnels: '14 Pasos', folder: false },
  { name: 'Agency Funnel (Gradient) Copy (1)', updated: 'Jul 18, 2025 05:12 PM', funnels: '14 Pasos', folder: false },
]

export default function SitesPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Topbar tabs */}
      <div style={{ padding: '0 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '12px 0 0' }}>
          <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 20, fontWeight: 700, margin: 0, marginRight: 24 }}>
            Sitios
          </h1>
          {TABS.map((tab, i) => (
            <div key={tab} style={{
              padding: '8px 12px', fontSize: 12, whiteSpace: 'nowrap',
              color: i === 0 ? '#3b82f6' : '#6b6b8a',
              borderBottom: i === 0 ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
            }}>
              {tab}
              {tab === 'SEO' && <span style={{ marginLeft: 4, fontSize: 9, background: '#ef4444', color: '#fff', padding: '1px 4px', borderRadius: 4, verticalAlign: 'super' }}>Beta</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, margin: 0 }}>Embudos</h2>
            <p style={{ fontSize: 13, color: '#6b6b8a', margin: '4px 0 0' }}>Crea embudos para generar clientes potenciales, citas y recibir pagos</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9090b0', fontSize: 13, cursor: 'pointer' }}>
              📁 Crear carpeta
            </button>
            <button style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.3)', background: 'transparent', color: '#7c3aed', fontSize: 13, cursor: 'pointer' }}>
              ✦ Crear con AI
            </button>
            <button style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
              △ Beta
            </button>
            <button style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>
              + Nuevo embudo
            </button>
          </div>
        </div>

        {/* Search + view toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 20 }}>
          <span style={{ fontSize: 13, color: '#9090b0' }}>Inicio</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#9090b0', cursor: 'pointer', fontSize: 14 }}>⏱</button>
            <button style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9090b0', cursor: 'pointer', fontSize: 14 }}>☰</button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#14141f', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#6b6b8a', marginLeft: 8,
            }}>
              🔍 Buscar embudos
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 200px 120px 40px',
            padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
            fontSize: 12, color: '#6b6b8a', fontWeight: 500,
          }}>
            <span>Nombre</span>
            <span>Última actualización</span>
            <span></span>
            <span></span>
          </div>

          {FUNNELS.map((funnel, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 200px 120px 40px',
              padding: '14px 20px', alignItems: 'center',
              borderBottom: i < FUNNELS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              fontSize: 13, color: '#e8e8f0', cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>{funnel.folder ? '📁' : '📄'}</span>
                <span>{funnel.name}</span>
              </div>
              <span style={{ fontSize: 12, color: '#6b6b8a', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>{funnel.updated}</span>
              <span style={{ fontSize: 12, color: '#3b82f6' }}>{funnel.funnels}</span>
              <span style={{ textAlign: 'right', color: '#6b6b8a', cursor: 'pointer' }}>⋮</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
