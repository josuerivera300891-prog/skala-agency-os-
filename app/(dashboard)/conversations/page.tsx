'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  client_id: string
  lead_id: string | null
  direction: 'inbound' | 'outbound'
  channel: 'whatsapp' | 'sms' | 'email'
  from_number: string | null
  to_number: string | null
  body: string
  status: string
  created_at: string
}

interface Thread {
  key: string
  phone: string
  lastMessage: string
  lastTime: string
  channel: string
  unread: number
  clientName: string
  messages: Message[]
}

const CHANNEL_ICON: Record<string, string> = {
  whatsapp: '💬',
  sms: '📱',
  email: '📧',
}

export default function ConversationsPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  useEffect(() => {
    loadMessages()
  }, [])

  async function loadMessages() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) return

    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .eq('agency_id', profile.agency_id)

    const clientList = (clients ?? []) as Array<{ id: string; name: string }>
    const clientIds = clientList.map((c) => c.id)
    const clientMap = Object.fromEntries(clientList.map((c) => [c.id, c.name]))

    if (clientIds.length === 0) { setLoading(false); return }

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .in('client_id', clientIds)
      .order('created_at', { ascending: true })

    const allMessages = (messages ?? []) as Message[]

    // Group by phone number (from_number for inbound, to_number for outbound)
    const threadMap = new Map<string, Message[]>()
    for (const msg of allMessages) {
      const phone = msg.direction === 'inbound' ? msg.from_number : msg.to_number
      const key = `${msg.client_id}:${phone ?? 'unknown'}`
      if (!threadMap.has(key)) threadMap.set(key, [])
      threadMap.get(key)!.push(msg)
    }

    const threadList: Thread[] = Array.from(threadMap.entries()).map(([key, msgs]) => {
      const last = msgs[msgs.length - 1]
      const phone = last.direction === 'inbound' ? last.from_number : last.to_number
      return {
        key,
        phone: phone ?? 'unknown',
        lastMessage: last.body,
        lastTime: last.created_at,
        channel: last.channel,
        unread: msgs.filter((m) => m.direction === 'inbound' && m.status !== 'read').length,
        clientName: clientMap[last.client_id] ?? '',
        messages: msgs,
      }
    }).sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime())

    setThreads(threadList)
    if (threadList.length > 0 && !selected) setSelected(threadList[0].key)
    setLoading(false)
  }

  const activeThread = threads.find((t) => t.key === selected)

  async function handleSend() {
    if (!reply.trim() || !activeThread) return
    setSending(true)
    setSendError(null)

    const [clientId, ...phoneParts] = activeThread.key.split(':')
    const phone = phoneParts.join(':') // preserve whatsapp:+1... format if present

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phone,
          clientId,
          body: reply,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Error al enviar mensaje')
      }

      // Use server-returned message if available, otherwise build optimistic one
      const newMsg: Message = data.message ?? {
        id: crypto.randomUUID(),
        client_id: clientId,
        lead_id: null,
        direction: 'outbound',
        channel: activeThread.channel as Message['channel'],
        from_number: null,
        to_number: activeThread.phone,
        body: reply,
        status: 'sent',
        created_at: new Date().toISOString(),
      }

      setThreads((prev) =>
        prev.map((t) =>
          t.key === selected ? { ...t, messages: [...t.messages, newMsg], lastMessage: reply, lastTime: newMsg.created_at } : t
        )
      )
      setReply('')
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6b8a' }}>
        Cargando conversaciones...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Thread list */}
      <div style={{
        width: 320, borderRight: '1px solid rgba(255,255,255,0.07)',
        overflowY: 'auto', background: '#0a0a14', flexShrink: 0,
      }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: 16, fontWeight: 700, margin: 0 }}>
            Conversaciones
          </h2>
          <p style={{ fontSize: 11, color: '#6b6b8a', margin: '4px 0 0' }}>{threads.length} hilos</p>
        </div>

        {threads.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#6b6b8a', fontSize: 13 }}>
            Sin conversaciones todavia
          </div>
        )}

        {threads.map((thread) => (
          <div
            key={thread.key}
            onClick={() => setSelected(thread.key)}
            style={{
              padding: '14px 16px', cursor: 'pointer',
              background: selected === thread.key ? 'rgba(124,58,237,0.1)' : 'transparent',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              borderLeft: selected === thread.key ? '3px solid #7c3aed' : '3px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#e8e8f0' }}>
                {CHANNEL_ICON[thread.channel] ?? '•'} {thread.phone.replace('whatsapp:', '')}
              </span>
              <span style={{ fontSize: 10, color: '#6b6b8a', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
                {new Date(thread.lastTime).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#6b6b8a', marginBottom: 2 }}>{thread.clientName}</div>
            <div style={{
              fontSize: 12, color: '#9090b0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {thread.lastMessage}
            </div>
            {thread.unread > 0 && (
              <span style={{
                display: 'inline-block', marginTop: 4,
                background: '#ff2ea8', color: '#fff', fontSize: 10,
                padding: '1px 6px', borderRadius: 10, fontWeight: 600,
              }}>
                {thread.unread}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a0a0f' }}>
        {activeThread ? (
          <>
            {/* Chat header */}
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: '#fff', fontWeight: 600,
              }}>
                {CHANNEL_ICON[activeThread.channel]}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#e8e8f0' }}>
                  {activeThread.phone.replace('whatsapp:', '')}
                </div>
                <div style={{ fontSize: 11, color: '#6b6b8a' }}>
                  {activeThread.clientName} · {activeThread.channel}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeThread.messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    maxWidth: '70%',
                    alignSelf: msg.direction === 'outbound' ? 'flex-end' : 'flex-start',
                    background: msg.direction === 'outbound' ? 'rgba(124,58,237,0.2)' : '#14141f',
                    border: msg.direction === 'outbound' ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: msg.direction === 'outbound' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ fontSize: 13, color: '#e8e8f0', lineHeight: 1.5 }}>{msg.body}</div>
                  <div style={{
                    fontSize: 10, color: '#6b6b8a', marginTop: 4,
                    textAlign: msg.direction === 'outbound' ? 'right' : 'left',
                    fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
                  }}>
                    {new Date(msg.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    {msg.direction === 'outbound' && (
                      <span style={{ marginLeft: 6, color: msg.status === 'sent' ? '#10b981' : '#6b6b8a' }}>
                        {msg.status === 'sent' ? '✓' : msg.status === 'delivered' ? '✓✓' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply input */}
            {sendError && (
              <div style={{
                padding: '8px 20px', fontSize: 12,
                background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                borderTop: '1px solid rgba(239,68,68,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>{sendError}</span>
                <button
                  onClick={() => setSendError(null)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}
                >
                  x
                </button>
              </div>
            )}
            <div style={{
              padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', gap: 10,
            }}>
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Escribe un mensaje..."
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#e8e8f0',
                  background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
                  boxSizing: 'border-box', outline: 'none',
                }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !reply.trim()}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff',
                  fontSize: 13, fontWeight: 500, opacity: !reply.trim() ? 0.5 : 1,
                }}
              >
                Enviar
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6b8a', fontSize: 13 }}>
            Selecciona una conversacion
          </div>
        )}
      </div>
    </div>
  )
}
