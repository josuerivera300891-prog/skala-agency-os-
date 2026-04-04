'use client'

import type { ReactNode, ComponentType } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Rocket, LayoutDashboard, MessageSquare, Calendar, Users, Target,
  CreditCard, Bot, Megaphone, Zap, Globe, Star, BarChart3, Settings,
  ChevronDown, Search, Building2,
  type LucideProps
} from 'lucide-react'

interface ClientEntry {
  id: string
  name: string
  city: string | null
}

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
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Account switcher state
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [clients, setClients] = useState<ClientEntry[]>([])
  const [searchText, setSearchText] = useState('')
  const [agencyName, setAgencyName] = useState('Skala Marketing')
  const switcherRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', user.id)
        .single()

      if (!profile?.agency_id) return

      const { data: agency } = await supabase
        .from('agencies')
        .select('name')
        .eq('id', profile.agency_id)
        .single()

      if (agency?.name) setAgencyName(agency.name)

      const { data: clientList } = await supabase
        .from('clients')
        .select('id, name, city')
        .eq('agency_id', profile.agency_id)
        .order('name')

      if (clientList) setClients(clientList)
    }
    loadData()
  }, [])

  // Close switcher on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
        setSearchText('')
      }
    }
    if (switcherOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [switcherOpen])

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  )

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

        {/* Account Switcher */}
        <div ref={switcherRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setSwitcherOpen(!switcherOpen); setSearchText('') }}
            style={{
              width: '100%', padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#14141f' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Building2 size={14} color="#fff" />
            </div>
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: '#e8e8f0',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {agencyName}
              </div>
              <div style={{ fontSize: 10, color: '#6b6b8a' }}>Agencia</div>
            </div>
            <ChevronDown
              size={14}
              color="#6b6b8a"
              style={{
                flexShrink: 0,
                transform: switcherOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s',
              }}
            />
          </button>

          {/* Dropdown */}
          {switcherOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              zIndex: 100,
              background: '#14141f',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0 0 8px 8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              maxHeight: 340, display: 'flex', flexDirection: 'column',
            }}>
              {/* Agency option */}
              <button
                onClick={() => {
                  router.push('/dashboard')
                  setSwitcherOpen(false)
                  setSearchText('')
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', background: 'transparent', border: 'none',
                  cursor: 'pointer', width: '100%', textAlign: 'left',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Building2 size={12} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e8e8f0' }}>{agencyName}</div>
                  <div style={{ fontSize: 10, color: '#6b6b8a' }}>Vista de agencia</div>
                </div>
              </button>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 10px' }} />

              {/* Search */}
              <div style={{ padding: '8px 10px', position: 'relative' }}>
                <Search size={13} color="#6b6b8a" style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Buscar subcuenta..."
                  autoFocus
                  style={{
                    width: '100%', padding: '7px 8px 7px 28px',
                    background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6, color: '#e8e8f0', fontSize: 12,
                    outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Client list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '2px 4px 6px' }}>
                {filteredClients.length === 0 && (
                  <div style={{ padding: '12px 10px', fontSize: 11, color: '#6b6b8a', textAlign: 'center' }}>
                    Sin resultados
                  </div>
                )}
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => {
                      router.push(`/portal/${client.id}`)
                      setSwitcherOpen(false)
                      setSearchText('')
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 10px', background: 'transparent', border: 'none',
                      cursor: 'pointer', width: '100%', textAlign: 'left',
                      borderRadius: 4, transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: '#7c3aed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-syne), Syne, sans-serif',
                      fontWeight: 700, fontSize: 11, color: '#fff', flexShrink: 0,
                    }}>
                      {client.name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 500, color: '#e8e8f0',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {client.name}
                      </div>
                      {client.city && (
                        <div style={{ fontSize: 10, color: '#6b6b8a' }}>{client.city}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
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
