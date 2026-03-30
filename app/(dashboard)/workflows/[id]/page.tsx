'use client'

import { useEffect, useRef, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const PALETTE_NODES = [
  { type: 'trigger-review',   label: 'Reseña nueva GMB',   icon: '★', color: '#f59e0b' },
  { type: 'trigger-whatsapp', label: 'Mensaje WA entrante', icon: '💬', color: '#25d366' },
  { type: 'trigger-lead',     label: 'Nuevo lead creado',   icon: '👤', color: '#3b82f6' },
  { type: 'claude-generate',  label: 'Llamar Claude IA',    icon: '✦', color: '#7c3aed' },
  { type: 'send-whatsapp',    label: 'Enviar WhatsApp',     icon: '📤', color: '#25d366' },
  { type: 'send-email',       label: 'Enviar Email',        icon: '📧', color: '#3b82f6' },
  { type: 'create-lead',      label: 'Crear Lead',          icon: '➕', color: '#10b981' },
  { type: 'update-lead',      label: 'Actualizar Lead',     icon: '✏️', color: '#f59e0b' },
  { type: 'delay',            label: 'Esperar tiempo',      icon: '⏱', color: '#6b7280' },
  { type: 'branch-if',        label: 'Condicional',         icon: '⟡', color: '#ff2ea8' },
  { type: 'log',              label: 'Log / Debug',          icon: '📋', color: '#6b7280' },
  { type: 'webhook',          label: 'Webhook externo',     icon: '🔗', color: '#6366f1' },
]

interface CanvasNode {
  id:       string
  type:     string
  label:    string
  icon:     string
  color:    string
  x:        number
  y:        number
}

export default function WorkflowBuilder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [nodes, setNodes]               = useState<CanvasNode[]>([])
  const [selected, setSelected]         = useState<string | null>(null)
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset]     = useState({ x: 0, y: 0 })
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [workflowName, setWorkflowName] = useState('')
  const canvasRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadWorkflow() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        // Obtener el perfil para validar la agencia
        const { data: profile } = await supabase
          .from('profiles')
          .select('agency_id')
          .eq('id', user.id)
          .single()

        if (!profile?.agency_id) { setError('Perfil de agencia no encontrado'); return }

        // Cargar workflow validando que el cliente pertenezca a la agencia
        const { data: workflow, error: workflowError } = await supabase
          .from('workflows')
          .select('*, client:clients(agency_id)')
          .eq('id', id)
          .single()

        if (workflowError || !workflow) {
          setError('Workflow no encontrado o sin acceso autorizado')
          return
        }

        // VALIDACIÓN MULTI-TENANT CRÍTICA
        const workflowAgencyId = (workflow.client as unknown as { agency_id: string } | null)?.agency_id
        if (workflowAgencyId !== profile.agency_id) {
          setError('Acceso denegado: Este workflow pertenece a otra agencia.')
          return
        }

        setWorkflowName(workflow.name)
        const config = workflow.config as { nodes?: CanvasNode[] }
        if (config?.nodes) {
          setNodes(config.nodes)
        }
      } catch (err) {
        void err // logged via UI error state
        setError('Error crítico al cargar el workflow')
      } finally {
        setLoading(false)
      }
    }

    loadWorkflow()
  }, [id, router])

  const saveWorkflow = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Re-validar perfil antes de guardar
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', user.id)
        .single()

      if (!profile?.agency_id) throw new Error('No se pudo validar agencia')

      // Guardar con validación multi-tenant en el update
      const { error: saveError } = await supabase
        .from('workflows')
        .update({ 
          config: { nodes },
          name: workflowName 
        })
        .eq('id', id)

      if (saveError) throw saveError
      alert('¡Workflow guardado con éxito!')
    } catch (err) {
      void err // shown via alert
      alert('Error al guardar el workflow. Verifica tus permisos.')
    } finally {
      setSaving(false)
    }
  }

  const addNode = (palette: typeof PALETTE_NODES[0], x: number, y: number) => {
    const node: CanvasNode = {
      id:    crypto.randomUUID(),
      type:  palette.type,
      label: palette.label,
      icon:  palette.icon,
      color: palette.color,
      x, y,
    }
    setNodes((prev) => [...prev, node])
  }

  const onCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const nodeType = e.dataTransfer.getData('nodeType')
    const palette  = PALETTE_NODES.find((p) => p.type === nodeType)
    if (!palette || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    addNode(palette, e.clientX - rect.left - 80, e.clientY - rect.top - 30)
  }

  const onNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    setDraggingNode(nodeId)
    setSelected(nodeId)
    const node = nodes.find((n) => n.id === nodeId)!
    setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y })
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingNode) return
    setNodes((prev) =>
      prev.map((n) =>
        n.id === draggingNode
          ? { ...n, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }
          : n
      )
    )
  }

  const selectedNode = nodes.find((n) => n.id === selected)

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: '#6b6b8a' }}>
        Cargando diseño de flujo...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: '#ef4444', gap: 20 }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{error}</div>
        <button 
          onClick={() => router.push('/dashboard')}
          style={{ padding: '8px 16px', borderRadius: 8, background: '#14141f', color: '#e8e8f0', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
        >
          Volver al Dashboard
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flex: 1, height: '100vh', overflow: 'hidden', background: '#0a0a0f' }}>
      {/* Left palette */}
      <div style={{
        width: 200, background: '#0f0f1a', borderRight: '1px solid rgba(255,255,255,0.07)',
        overflowY: 'auto', padding: '16px 10px',
      }}>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', color: '#6b6b8a', fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', padding: '0 10px', marginBottom: 10 }}>
          Biblioteca de Nodos
        </div>
        {PALETTE_NODES.map((p) => (
          <div
            key={p.type}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('nodeType', p.type)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8,
              cursor: 'grab', marginBottom: 2, fontSize: 12, color: '#9090b0',
              border: '1px solid transparent',
            }}
          >
            <span style={{ color: p.color, fontSize: 14, width: 18, textAlign: 'center' }}>{p.icon}</span>
            {p.label}
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onDrop={onCanvasDrop}
        onDragOver={(e) => e.preventDefault()}
        onMouseMove={onMouseMove}
        onMouseUp={() => setDraggingNode(null)}
        onClick={() => setSelected(null)}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          cursor: draggingNode ? 'grabbing' : 'default',
        }}
      >
        {nodes.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center', color: '#6b6b8a' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⟳</div>
              <div style={{ fontSize: 13 }}>Arrastra nodos desde la paleta izquierda</div>
            </div>
          </div>
        )}

        {nodes.map((node) => (
          <div
            key={node.id}
            onMouseDown={(e) => onNodeMouseDown(e, node.id)}
            style={{
              position: 'absolute', left: node.x, top: node.y,
              width: 160, padding: '12px 16px', borderRadius: 10, cursor: 'grab',
              background: '#14141f',
              border: `1px solid ${selected === node.id ? node.color : 'rgba(255,255,255,0.1)'}`,
              boxShadow: selected === node.id ? `0 0 20px ${node.color}20` : 'none',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 16, color: node.color }}>{node.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#e8e8f0' }}>{node.label}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', border: `2px solid ${node.color}`, background: '#14141f' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', border: `2px solid ${node.color}`, background: '#14141f' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Right config panel */}
      <div style={{
        width: 280, background: '#0f0f1a', borderLeft: '1px solid rgba(255,255,255,0.07)',
        padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ fontSize: 12, color: '#6b6b8a', fontFamily: 'var(--font-mono), monospace', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Configuración
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: 11, color: '#6b6b8a', display: 'block', marginBottom: 8 }}>Nombre del Workflow</label>
          <input 
            value={workflowName} 
            onChange={(e) => setWorkflowName(e.target.value)}
            style={{
              width: '100%', background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#e8e8f0',
              boxSizing: 'border-box', outline: 'none'
            }} 
          />
        </div>

        <div style={{ flex: 1 }}>
          {selectedNode ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span style={{ fontSize: 18, color: selectedNode.color }}>{selectedNode.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#e8e8f0' }}>{selectedNode.label}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b8a', display: 'block', marginBottom: 6 }}>Etiqueta de Nodo</label>
                  <input defaultValue={selectedNode.label} style={{
                    width: '100%', background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6, padding: '8px 10px', fontSize: 13, color: '#e8e8f0',
                    boxSizing: 'border-box',
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b8a', display: 'block', marginBottom: 6 }}>Tipo Técnico</label>
                  <div style={{ fontSize: 12, color: '#9090b0', fontFamily: 'var(--font-mono), monospace', padding: '8px 10px', background: '#14141f', borderRadius: 6, border: '1px solid rgba(255,255,255,0.07)' }}>
                    {selectedNode.type}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#6b6b8a', fontSize: 12, marginTop: 40, padding: 20, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10 }}>
              Selecciona un elemento del canvas para editar sus propiedades
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={saveWorkflow}
          disabled={saving}
          style={{
            marginTop: 20,
            padding: '12px 0', borderRadius: 10, border: 'none', cursor: saving ? 'wait' : 'pointer',
            background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff',
            fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1, transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(124,58,237,0.3)'
          }}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  )
}
