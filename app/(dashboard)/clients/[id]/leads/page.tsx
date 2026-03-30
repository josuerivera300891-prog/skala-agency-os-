'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Lead } from '@/types'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const COLUMNS = [
  { key: 'new',         label: '🟡 Nuevo Lead',      color: '#f59e0b' },
  { key: 'contacted',   label: '📧 Contactado',      color: '#7c3aed' },
  { key: 'appointment', label: '📅 Cita Agendada',    color: '#3b82f6' },
  { key: 'nurture',     label: '🤝 En Negociación',   color: '#f97316' },
  { key: 'closed',      label: '🏆 Cerrado, Ganado',  color: '#10b981' },
] as const

const SOURCE_ICONS: Record<string, string> = {
  whatsapp: '💬', web_form: '🌐', gmb_call: '📞', referral: '🤝',
}

export default function ClientLeads() {
  const { id } = useParams<{ id: string }>()
  const [leads, setLeads] = useState<Lead[]>([])
  const [clientName, setClientName] = useState('')
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      // 1. Obtener usuario y perfil para validación multi-tenant
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', user.id)
        .single()

      if (!profile?.agency_id) return

      // 2. Consultar datos filtrando por agency_id para asegurar aislamiento
      const [{ data: client }, { data: leadsData }] = await Promise.all([
        supabase.from('clients').select('name').eq('id', id).eq('agency_id', profile.agency_id).single(),
        supabase.from('leads').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      ])

      if (client) setClientName(client.name)
      if (leadsData) setLeads(leadsData as Lead[])
    }
    load()
  }, [id])


  const filteredLeads = search
    ? leads.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()) || l.service?.toLowerCase().includes(search.toLowerCase()))
    : leads

  const onDragStart = (leadId: string) => setDraggedId(leadId)

  const onDrop = async (status: string) => {
    if (!draggedId) return
    setLeads((prev) => prev.map((l) => l.id === draggedId ? { ...l, status: status as Lead['status'] } : l))
    setDraggedId(null)
    const supabase = createClient()
    await supabase.from('leads').update({ status }).eq('id', draggedId)
  }

  const totalValue = leads.length * 320 // valor promedio estimado

  if (!clientName && leads.length === 0) {
    return (
      <div style={{ padding: 28, flex: 1 }}>
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
          <h2 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Sin datos de leads</h2>
          <p style={{ fontSize: 13, color: '#6b6b8a' }}>Conecta Supabase para ver el CRM del cliente.</p>
          <Link href="/clients" style={{ display: 'inline-block', marginTop: 16, padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff', textDecoration: 'none', fontSize: 13 }}>Ver clientes</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Topbar */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 20, fontWeight: 700, margin: 0 }}>
          Clientes Potenciales
        </h1>
        <div style={{ display: 'flex', gap: 4, marginLeft: 16 }}>
          <button onClick={() => setView('kanban')} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 12, border: 'none', cursor: 'pointer',
            background: view === 'kanban' ? 'rgba(124,58,237,0.2)' : 'transparent',
            color: view === 'kanban' ? '#e8e8f0' : '#6b6b8a',
          }}>☰ Todo</button>
          <button onClick={() => setView('list')} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 12, border: 'none', cursor: 'pointer',
            background: view === 'list' ? 'rgba(124,58,237,0.2)' : 'transparent',
            color: view === 'list' ? '#e8e8f0' : '#6b6b8a',
          }}>+ Lista</button>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#14141f', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#6b6b8a', minWidth: 180,
        }}>
          🔍
          <input
            placeholder="Buscar Clientes Potenci..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#e8e8f0', fontSize: 12, outline: 'none', flex: 1 }}
          />
        </div>
        <button style={{
          padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 500,
        }}>+ Añadir oportunidad</button>
      </div>

      {/* Kanban */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '20px 28px' }}>
        <div style={{ display: 'flex', gap: 16, height: '100%', minWidth: COLUMNS.length * 280 }}>
          {COLUMNS.map((col) => {
            const colLeads = filteredLeads.filter((l) => l.status === col.key)
            return (
              <div
                key={col.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(col.key)}
                style={{
                  flex: 1, minWidth: 250, display: 'flex', flexDirection: 'column',
                  background: '#0a0a14', borderRadius: 12, overflow: 'hidden',
                  border: draggedId ? '1px dashed rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {/* Column header */}
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{col.label}</div>
                    <div style={{ fontSize: 11, color: '#6b6b8a', fontFamily: 'var(--font-dm-mono), DM Mono, monospace', marginTop: 2 }}>
                      {colLeads.length} Clientes potenciales · ${(colLeads.length * 320).toFixed(2)}
                    </div>
                  </div>
                  <span style={{ fontSize: 14, color: '#6b6b8a', cursor: 'pointer' }}>‹</span>
                </div>

                {/* Cards */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => onDragStart(lead.id)}
                      style={{
                        background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 10, padding: '14px 16px', cursor: 'grab',
                        transition: 'box-shadow 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#e8e8f0' }}>{lead.name}</span>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12,
                        }}>👤</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b6b8a', marginBottom: 8 }}>
                        Valor del cliente... $320.00
                      </div>
                      <div style={{ display: 'flex', gap: 6, fontSize: 13, color: '#6b6b8a' }}>
                        <span title="Llamar" style={{ cursor: 'pointer' }}>📞</span>
                        <span title="WhatsApp" style={{ cursor: 'pointer' }}>💬</span>
                        <span title="SMS" style={{ cursor: 'pointer' }}>📱</span>
                        <span title="Email" style={{ cursor: 'pointer' }}>📧</span>
                        <span title="Nota" style={{ cursor: 'pointer' }}>📝</span>
                        <span title="Cita" style={{ cursor: 'pointer' }}>📅</span>
                      </div>
                      {lead.source && (
                        <div style={{ marginTop: 8, fontSize: 10, color: '#6b6b8a', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
                          {SOURCE_ICONS[lead.source] ?? '•'} {lead.source}
                          {lead.service && ` · ${lead.service}`}
                        </div>
                      )}
                    </div>
                  ))}
                  {colLeads.length === 0 && (
                    <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#4a4a6a' }}>
                      Arrastra leads aquí
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
