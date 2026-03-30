import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#080810',
      fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: 420, padding: 32,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 12px',
            background: 'linear-gradient(135deg,#ff2ea8,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#fff',
          }}>S</div>
          <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: 20, background: 'linear-gradient(90deg,#ff2ea8,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Skala Agency OS
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
