import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Client } from '@/types'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let allClients: Client[] = []

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (profile?.agency_id) {
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .order('created_at', { ascending: false })

      allClients = (clients as Client[]) ?? []
    }
  }

  return (
    <div style={{ padding: 28, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, margin: 0 }}>
            Clientes
          </h1>
          <p style={{ fontSize: 12, color: '#6b6b8a', fontFamily: 'DM Mono, monospace', margin: 0 }}>
            {allClients.length} clientes registrados
          </p>
        </div>
        <Link href="/clients/new" style={{
          padding: '10px 20px', borderRadius: 8, border: 'none', textDecoration: 'none',
          background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)', color: '#fff',
          fontSize: 13, fontWeight: 600,
        }}>
          + Agregar cliente
        </Link>
      </div>

      {allClients.length === 0 ? (
        <div style={{
          background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '60px 40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⬡</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Sin clientes todavia
          </h2>
          <p style={{ fontSize: 13, color: '#6b6b8a', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            Conecta Supabase con tus credenciales en <code style={{ color: '#ff2ea8', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>.env.local</code> y crea tu primer cliente para empezar.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {allClients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '20px 24px', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff',
                  }}>{client.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#e8e8f0' }}>{client.name}</div>
                    <div style={{ fontSize: 12, color: '#6b6b8a', textTransform: 'capitalize' }}>{client.vertical}</div>
                  </div>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: client.active ? '#10b981' : '#6b6b8a',
                  }} />
                </div>

                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#6b6b8a' }}>
                  {client.gmb_location_id && (
                    <span style={{ background: 'rgba(124,58,237,0.15)', color: '#7c3aed', padding: '3px 8px', borderRadius: 6 }}>
                      GMB
                    </span>
                  )}
                  {client.config?.twilio_wa_number && (
                    <span style={{ background: 'rgba(37,211,102,0.15)', color: '#25d366', padding: '3px 8px', borderRadius: 6 }}>
                      WhatsApp
                    </span>
                  )}
                  {client.email && (
                    <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', padding: '3px 8px', borderRadius: 6 }}>
                      Email
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
