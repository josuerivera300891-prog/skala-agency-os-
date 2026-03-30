'use client'

import { useState } from 'react'

const TABS = ['Primeros pasos', 'Agent Studio', 'Alde voz', 'Conversation AI', 'Base de Conocimiento', 'Plantillas de Agentes', 'Content AI', 'Agent Logs']

const SIDEBAR_ITEMS = [
  { icon: '🎙️', label: 'IA de voz', active: true },
  { icon: '💬', label: 'IA conversacional', active: false },
]

const GETTING_STARTED = [
  { icon: '👤', title: 'Crear su primer agente de IA de voz', desc: 'Cree un nuevo agente de IA de voz en solo unos clics. Configure su nombre, saludo y flujo básico de conversación para comenzar a aprovechar las interacciones por voz.' },
  { icon: '📡', title: 'Probar y hablar con su agente de IA de voz', desc: 'Realice una llamada de prueba rápida con su agente de IA de voz. Esto ayuda a confirmar que está configurado correctamente y le permitirá hacerse una idea de cómo gestiona conversaciones básicas.' },
  { icon: '📞', title: 'Asignar un número de teléfono y ponerlo en producción', desc: 'Vincular un número de teléfono dedicado a su agente de IA de voz o habilitarlo como respaldo del número de teléfono en caso de que no esté disponible.' },
]

export default function AiAgentsPage() {
  const [activeTab, setActiveTab] = useState('Primeros pasos')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Topbar */}
      <div style={{ padding: '0 28px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 20, fontWeight: 700, padding: '16px 0 0', margin: 0 }}>
          Agentes de AI
        </h1>
        <div style={{ display: 'flex', gap: 0, marginTop: 8, overflowX: 'auto' }}>
          {TABS.map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 14px', fontSize: 13, whiteSpace: 'nowrap', cursor: 'pointer',
                color: activeTab === tab ? '#e8e8f0' : '#6b6b8a',
                borderBottom: activeTab === tab ? '2px solid #ff2ea8' : '2px solid transparent',
              }}
            >{tab}</div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32 }}>
          {/* Left sidebar */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e8e8f0', marginBottom: 16 }}>Primeros pasos</h3>
            {SIDEBAR_ITEMS.map((item) => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 8, marginBottom: 4, cursor: 'pointer',
                background: item.active ? 'rgba(59,130,246,0.1)' : 'transparent',
                color: item.active ? '#3b82f6' : '#9090b0', fontSize: 14,
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>

          {/* Right content */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
              Hola Jossue, aquí tiene algunas cosas para comenzar
            </h2>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '16px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {GETTING_STARTED.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '20px 24px',
                  background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: i === 0 ? '12px 12px 2px 2px' : i === GETTING_STARTED.length - 1 ? '2px 2px 12px 12px' : '2px',
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: '#14141f', border: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>{step.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#e8e8f0', marginBottom: 4 }}>{step.title}</div>
                    <div style={{ fontSize: 12, color: '#6b6b8a', lineHeight: 1.6 }}>{step.desc}</div>
                  </div>
                  <span style={{ fontSize: 18, color: '#6b6b8a', flexShrink: 0 }}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
