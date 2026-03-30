import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  style?: React.CSSProperties
}

const BADGE_COLORS: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  default: { bg: 'rgba(255,255,255,0.05)', color: '#9090b0', border: 'rgba(255,255,255,0.1)' },
  success: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', border: 'rgba(34,197,94,0.25)' },
  warning: { bg: 'rgba(234,179,8,0.12)', color: '#eab308', border: 'rgba(234,179,8,0.25)' },
  danger:  { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
  info:    { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: 'rgba(59,130,246,0.25)' },
  purple:  { bg: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: 'rgba(124,58,237,0.25)' },
}

export default function Badge({ children, variant = 'default', style }: BadgeProps) {
  const colors = BADGE_COLORS[variant]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        background: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        ...style,
      }}
    >
      {children}
    </span>
  )
}
