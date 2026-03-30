'use client'

import type { ReactNode, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  loading?: boolean
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #ff2ea8, #7c3aed)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: '#14141f',
    color: '#e8e8f0',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  ghost: {
    background: 'transparent',
    color: '#9090b0',
    border: '1px solid transparent',
  },
  danger: {
    background: 'rgba(239,68,68,0.15)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.3)',
  },
}

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 12, borderRadius: 6 },
  md: { padding: '8px 16px', fontSize: 13, borderRadius: 8 },
  lg: { padding: '12px 24px', fontSize: 14, borderRadius: 10 },
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        transition: 'all 0.15s ease',
        fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,
      }}
      {...props}
    >
      {loading && <span style={{ fontSize: 14 }}>⏳</span>}
      {children}
    </button>
  )
}
