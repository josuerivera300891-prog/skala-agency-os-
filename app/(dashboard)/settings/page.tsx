'use client'

import { useState } from 'react'

const SIDEBAR_SECTIONS = [
  { group: 'MI EMPRESA', items: ['Perfil de empresa', 'Mi perfil', 'Facturación', 'Mi personal', 'Clientes Potenciales & Pipeli...'] },
  { group: 'SERVICIOS EMPRESARIALES', items: ['Calendarios', 'Servicios de correo electrónico', 'Sistema telefónico', 'WhatsApp'] },
  { group: 'OTROS AJUSTES', items: ['Objetos', 'Campos personalizados', 'Valores personalizados', 'Gestionar la puntuación', 'Centro de gestión de prefere...', 'Dominios y redirecciones de ...', 'Seguimiento externo', 'Integraciones', 'Integraciones Privado', 'Proveedores de conversación', 'Etiquetas', 'Laboratorios', 'Registros de auditoría'] },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Perfil de empresa')

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Settings Sidebar */}
      <div style={{
        width: 220, minHeight: '100%', background: '#0a0a14',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        overflowY: 'auto', padding: '16px 0', flexShrink: 0,
      }}>
        <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, color: '#6b6b8a' }}>←</span>
          <span style={{ fontSize: 13, color: '#9090b0' }}>Volver atrás</span>
        </div>
        <div style={{ padding: '8px 16px', fontSize: 10, letterSpacing: '0.1em', color: '#ff2ea8', textTransform: 'uppercase', fontWeight: 600 }}>
          CONFIGURACIÓN
        </div>

        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.group}>
            {section.group !== 'MI EMPRESA' && (
              <div style={{ padding: '12px 16px 4px', fontSize: 10, letterSpacing: '0.1em', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 600 }}>
                {section.group}
              </div>
            )}
            {section.items.map((item) => (
              <div
                key={item}
                onClick={() => setActiveTab(item)}
                style={{
                  padding: '7px 16px', fontSize: 13, cursor: 'pointer',
                  color: activeTab === item ? '#e8e8f0' : '#9090b0',
                  background: activeTab === item ? 'rgba(124,58,237,0.15)' : 'transparent',
                  borderLeft: activeTab === item ? '2px solid #7c3aed' : '2px solid transparent',
                }}
              >
                {item}
                {item === 'Objetos' && <span style={{ marginLeft: 6, fontSize: 9, background: '#10b981', color: '#fff', padding: '1px 5px', borderRadius: 4 }}>Nuevo</span>}
                {item === 'Laboratorios' && <span style={{ marginLeft: 6, fontSize: 9, background: '#10b981', color: '#fff', padding: '1px 5px', borderRadius: 4 }}>Nuevo</span>}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
          Business Profile Settings
        </h1>
        <p style={{ fontSize: 13, color: '#6b6b8a', marginBottom: 28 }}>
          Manage your business profile information & settings
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Left: Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8e8f0' }}>Información general</h3>
              <div style={{ fontSize: 12, color: '#6b6b8a', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
                Id. de la ubicación ⓘ <code style={{ color: '#9090b0' }}>dGqPr2HYmiVVKbOE67jP</code> 📋
              </div>
            </div>

            {/* Logo */}
            <div style={{
              display: 'flex', gap: 20, marginBottom: 24, padding: 20,
              background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
            }}>
              <div style={{
                width: 120, height: 120, borderRadius: 12,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 4, flexShrink: 0,
              }}>
                <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: 16, color: '#fff' }}>SKALA MKT</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.15em' }}>AGENCY</div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#e8e8f0', marginBottom: 4 }}>Logotipo de la empresa</div>
                <div style={{ fontSize: 11, color: '#6b6b8a', marginBottom: 12 }}>The proposed size is 350px * 180px. No bigger than 2.5 MB</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #3b82f6', background: 'transparent', color: '#3b82f6', fontSize: 12, cursor: 'pointer' }}>Subir</button>
                  <button style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9090b0', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
                </div>
              </div>
            </div>

            {/* Form fields */}
            <FormField label="Nombre comercial amigable" value="Skala Marketing" />
            <FormField label="Nombre legal de la empresa ⓘ" value="Josue E Rivera Talavera" hint="Introduzca el nombre legal de la empresa tal como está registrado en el EIN" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="Correo electrónico de la empresa" value="info@skalastudios.com" />
              <FormField label="Teléfono de la empresa" value="+1 774-445-1282" />
            </div>
            <FormField label="Dominio de marca ⓘ" value="" placeholder="Dominio de marca" />
            <FormField label="Sitio web de la empresa" value="" placeholder="https://" />
          </div>

          {/* Right: Address */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8e8f0', marginBottom: 20 }}>
              Dirección física de la empresa ⓘ
            </h3>

            <FormField label="Dirección postal ⓘ" value="3245 SW 25TH ST" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 16 }}>
              <FormField label="City" value="CORAL GABLES" />
              <FormField label="Código postal" value="33133" />
            </div>
            <FormField label="State / Prov / Region" value="Florida" isSelect />
            <FormField label="Country" value="United States" isSelect />
            <FormField label="Time Zone *" value="GMT-04:00 America/New_York (EDT)" isSelect />
            <FormField label="Idioma de la plataforma" value="Spanish" isSelect />
          </div>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, value, placeholder, hint, isSelect }: {
  label: string; value: string; placeholder?: string; hint?: string; isSelect?: boolean
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, color: '#9090b0', marginBottom: 6 }}>{label}</label>
      {isSelect ? (
        <div style={{
          padding: '10px 14px', borderRadius: 8, fontSize: 14, color: '#e8e8f0',
          background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {value} <span style={{ color: '#6b6b8a' }}>▾</span>
        </div>
      ) : (
        <input
          defaultValue={value}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14, color: '#e8e8f0',
            background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
            boxSizing: 'border-box', outline: 'none',
          }}
        />
      )}
      {hint && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}
