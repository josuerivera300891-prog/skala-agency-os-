import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  title?: string
  subtitle?: string
  padding?: number
  style?: React.CSSProperties
  className?: string
}

export default function Card({ children, title, subtitle, padding = 20, style, className }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: '#0f0f1a',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding,
        ...style,
      }}
    >
      {(title || subtitle) && (
        <div style={{ marginBottom: 16 }}>
          {title && (
            <h3 style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#e8e8f0',
              margin: 0,
              fontFamily: 'var(--font-syne), Syne, sans-serif',
            }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p style={{
              fontSize: 12,
              color: '#6b6b8a',
              margin: '4px 0 0',
            }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
