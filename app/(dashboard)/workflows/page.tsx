import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Workflow } from '@/types'

const TABS = ['Todos los flujos ...', 'Requiere revisió...', 'Eliminado']

export default async function WorkflowsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let allWorkflows: (Workflow & { clients: { name: string } | null })[] = []

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (profile?.agency_id) {
      const { data: agencyClients } = await supabase
        .from('clients')
        .select('id')
        .eq('agency_id', profile.agency_id)

      const clientIds = (agencyClients ?? []).map((c: { id: string }) => c.id)

      if (clientIds.length > 0) {
        const { data: workflows } = await supabase
          .from('workflows')
          .select('*, clients(name)')
          .in('client_id', clientIds)
          .order('created_at', { ascending: false })

        allWorkflows = (workflows as (Workflow & { clients: { name: string } | null })[]) ?? []
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Topbar */}
      <div style={{ padding: '0 28px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0' }}>
          <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 20, fontWeight: 700, margin: 0 }}>
            Automatización
          </h1>
          <span style={{ fontSize: 12, color: '#6b6b8a' }}>Flujos de trabajo</span>
          <span style={{ fontSize: 12, color: '#6b6b8a' }}>Visión general</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 22, fontWeight: 700, margin: 0 }}>
            Lista de Flujo de trabajo
          </h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9090b0', fontSize: 13, cursor: 'pointer' }}>
              📁 Crear Carpeta
            </button>
            <button style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.3)', background: 'transparent', color: '#7c3aed', fontSize: 13, cursor: 'pointer' }}>
              ✦ Construir vía AI
            </button>
            <Link href="/workflows/new" style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 500,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              + Crear Flujo de trabajo
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 16 }}>
          {TABS.map((tab, i) => (
            <div key={tab} style={{
              padding: '8px 16px', fontSize: 13,
              color: i === 0 ? '#ff2ea8' : '#6b6b8a',
              borderBottom: i === 0 ? '2px solid #ff2ea8' : '2px solid transparent',
              cursor: 'pointer',
            }}>{tab}</div>
          ))}
          <div style={{ padding: '8px 16px', fontSize: 13, color: '#6b6b8a', cursor: 'pointer' }}>+ Nueva Lista Inteligente</div>
          <div style={{ flex: 1 }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#14141f', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8, padding: '4px 12px', fontSize: 12, color: '#6b6b8a',
          }}>
            🔍 Buscar
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 1fr 100px 100px 120px 160px 160px 80px',
            padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
            fontSize: 12, color: '#6b6b8a', fontWeight: 500,
          }}>
            <span>☐</span>
            <span>Nombre</span>
            <span>Estado</span>
            <span>Total</span>
            <span>Cliente</span>
            <span>Última actualización</span>
            <span>Creado el</span>
            <span></span>
          </div>

          {/* Rows */}
          {allWorkflows.map((wf, i) => (
            <Link key={wf.id} href={`/workflows/${wf.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 100px 100px 120px 160px 160px 80px',
                padding: '14px 16px', alignItems: 'center',
                borderBottom: i < allWorkflows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                fontSize: 13, color: '#e8e8f0',
                transition: 'background 0.1s',
              }}>
                <span style={{ color: '#6b6b8a' }}>☐</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>📁</span>
                  <span>{wf.name}</span>
                </div>
                <span>
                  {wf.active ? (
                    <span style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: 11,
                      background: 'rgba(16,185,129,0.15)', color: '#10b981',
                    }}>Published</span>
                  ) : (
                    <span style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: 11,
                      background: 'rgba(107,107,138,0.15)', color: '#6b6b8a',
                    }}>Draft</span>
                  )}
                </span>
                <span style={{ color: '#ff2ea8', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>{wf.runs_today}</span>
                <span style={{ fontSize: 12, color: '#9090b0' }}>{wf.clients?.name ?? '—'}</span>
                <span style={{ fontSize: 12, color: '#6b6b8a', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
                  {wf.last_run ? new Date(wf.last_run).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ', ' + new Date(wf.last_run).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
                <span style={{ fontSize: 12, color: '#6b6b8a', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
                  {new Date(wf.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                </span>
                <span style={{ textAlign: 'right', color: '#6b6b8a', cursor: 'pointer' }}>⋮</span>
              </div>
            </Link>
          ))}

          {allWorkflows.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b6b8a', fontSize: 13 }}>
              Sin workflows todavía
            </div>
          )}
        </div>

        {/* Pagination */}
        {allWorkflows.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <span style={{ fontSize: 12, color: '#6b6b8a' }}>Previous</span>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(59,130,246,0.2)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>1</span>
            <span style={{ fontSize: 12, color: '#6b6b8a' }}>Next</span>
            <span style={{ fontSize: 12, color: '#6b6b8a', marginLeft: 8 }}>10 / page</span>
          </div>
        )}
      </div>
    </div>
  )
}
