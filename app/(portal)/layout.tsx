'use client'

import type { ReactNode, ComponentType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, MessageSquare, Star, Users, Globe, Settings,
  ArrowLeft,
  type LucideProps,
} from 'lucide-react'

function getClientIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/portal\/([^/]+)/)
  return match ? match[1] : null
}

function buildNav(clientId: string): { href: string; icon: ComponentType<LucideProps>; label: string }[] {
  return [
    { href: `/portal/${clientId}`,          icon: LayoutDashboard, label: 'Dashboard' },
    { href: `/portal/${clientId}/messages`,  icon: MessageSquare,   label: 'Mensajes' },
    { href: `/portal/${clientId}/reviews`,   icon: Star,            label: 'Resenas' },
    { href: `/portal/${clientId}/leads`,     icon: Users,           label: 'Leads' },
    { href: `/portal/${clientId}/website`,   icon: Globe,           label: 'Mi Web' },
    { href: `/portal/${clientId}/settings`,  icon: Settings,        label: 'Configuracion' },
  ]
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [clientName, setClientName] = useState<string | null>(null)
  const [isAgencyUser, setIsAgencyUser] = useState(false)

  const clientId = getClientIdFromPath(pathname)
  const navItems = clientId ? buildNav(clientId) : []

  useEffect(() => {
    if (!clientId) return
    const supabase = createClient()

    // Fetch client name
    supabase
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single()
      .then(({ data }) => {
        if (data?.name) setClientName(data.name)
      })

    // Check if user is agency owner/member (not a client-role user)
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role === 'owner' || profile?.role === 'member') {
        setIsAgencyUser(true)
      }
    }
    checkRole()
  }, [clientId])

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
        className="portal-mobile-btn"
      >
        {sidebarOpen ? '\u00D7' : '\u2261'}
      </button>

      {/* Sidebar */}
      <aside
        className="portal-sidebar"
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
        {/* Back to agency */}
        {isAgencyUser && (
          <Link
            href="/dashboard"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px',
              fontSize: 11, color: '#7c3aed', textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              transition: 'color 0.12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#a78bfa' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#7c3aed' }}
          >
            <ArrowLeft size={13} />
            Volver a la agencia
          </Link>
        )}

        {/* Header */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontWeight: 700, fontSize: 14, color: '#e8e8f0', letterSpacing: '-0.01em',
            marginBottom: 2,
          }}>
            {clientName ?? 'Portal'}
          </div>
          <div style={{ fontSize: 11, color: '#6b6b8a' }}>Portal de cliente</div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '8px 8px', flex: 1, overflowY: 'auto' }}>
          {navItems.map((item) => {
            const isExact = pathname === item.href
            const isActive = isExact || (item.href !== `/portal/${clientId}` && pathname.startsWith(item.href + '/'))
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false)
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
            }}>
              {clientName ? clientName[0].toUpperCase() : 'P'}
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#e8e8f0', fontWeight: 500 }}>{clientName ?? 'Cliente'}</div>
              <div style={{ fontSize: 10, color: '#6b6b8a' }}>Portal de cliente</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="portal-sidebar-overlay"
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
          .portal-mobile-btn { display: flex !important; }
          .portal-sidebar { position: fixed !important; top: 0; left: 0; bottom: 0; box-shadow: 4px 0 20px rgba(0,0,0,0.5); }
          .portal-sidebar-overlay { display: block !important; }
        }
      `}</style>
    </div>
  )
}
