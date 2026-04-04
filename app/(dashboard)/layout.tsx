'use client'

import type { ReactNode, ComponentType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Rocket, LayoutDashboard, MessageSquare, Calendar, Users, Target,
  CreditCard, Bot, Megaphone, Zap, Globe, Star, BarChart3, Settings,
  type LucideProps
} from 'lucide-react'

const NAV_SECTIONS: { items: { href: string; icon: ComponentType<LucideProps>; label: string }[] }[] = [
  {
    items: [
      { href: '/launchpad',     icon: Rocket,          label: 'Launchpad' },
      { href: '/dashboard',     icon: LayoutDashboard,  label: 'Tablero' },
      { href: '/conversations', icon: MessageSquare,    label: 'Conversaciones' },
      { href: '/calendars',     icon: Calendar,         label: 'Calendarios' },
      { href: '/contacts',      icon: Users,            label: 'Contactos' },
      { href: '/clients',       icon: Target,           label: 'Clientes' },
      { href: '/payments',      icon: CreditCard,       label: 'Pagos' },
    ],
  },
  {
    items: [
      { href: '/ai-agents',   icon: Bot,       label: 'Agentes de AI' },
      { href: '/marketing',   icon: Megaphone,  label: 'Marketing' },
      { href: '/workflows',   icon: Zap,        label: 'Automatizacion' },
      { href: '/sites',       icon: Globe,      label: 'Dominios' },
      { href: '/reputation',  icon: Star,       label: 'Reputacion' },
      { href: '/reports',     icon: BarChart3,   label: 'Informes' },
    ],
  },
  {
    items: [
      { href: '/settings', icon: Settings, label: 'Configuracion' },
    ],
  },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080810', color: '#e8e8f0', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 100,
          display: 'none', width: 40, height: 40, borderRadius: 8,
          background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)',
          color: '#e8e8f0', fontSize: 20, cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center',
        }}
        className="mobile-menu-btn"
      >
        {sidebarOpen ? '\u00D7' : '\u2261'}
      </button>

      {/* Sidebar */}
      <aside
        className="sidebar"
        style={{
          width: 220, minHeight: '100vh',
          background: '#0f0f1a',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          position: 'relative', zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontWeight: 800, fontSize: 18, color: '#e8e8f0', letterSpacing: '-0.02em',
          }}>
            Skala
          </span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }} />
        </div>

        {/* Nav */}
        <nav style={{ padding: '8px 8px', flex: 1, overflowY: 'auto' }}>
          {NAV_SECTIONS.map((section, si) => (
            <div key={si}>
              {si > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 8px' }} />}
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={() => {
                    if (window.innerWidth < 768) setSidebarOpen(false)
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                      fontSize: 13, marginBottom: 1,
                      color: isActive ? '#e8e8f0' : '#9090b0',
                      background: isActive ? '#14141f' : 'transparent',
                      borderLeft: isActive ? '2px solid #7c3aed' : '2px solid transparent',
                      transition: 'all 0.12s',
                    }}>
                      <Icon size={18} style={{ flexShrink: 0 }} />
                      {item.label}
                    </div>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: '#7c3aed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: 11, color: '#fff',
              flexShrink: 0,
            }}>JR</div>
            <div>
              <div style={{ fontSize: 12, color: '#e8e8f0', fontWeight: 500 }}>Josue Rivera</div>
              <div style={{ fontSize: 10, color: '#6b6b8a' }}>Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40,
          }}
        />
      )}

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .sidebar { position: fixed !important; top: 0; left: 0; bottom: 0; box-shadow: 4px 0 20px rgba(0,0,0,0.5); }
          .sidebar-overlay { display: block !important; }
        }
      `}</style>
    </div>
  )
}
