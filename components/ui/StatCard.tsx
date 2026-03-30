interface StatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: string
  style?: React.CSSProperties
}

export default function StatCard({ label, value, change, changeType = 'neutral', icon, style }: StatCardProps) {
  const changeColors = {
    positive: '#22c55e',
    negative: '#ef4444',
    neutral: '#6b6b8a',
  }

  return (
    <div
      style={{
        background: '#0f0f1a',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 0,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#6b6b8a', fontWeight: 500 }}>{label}</span>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#e8e8f0', fontFamily: 'var(--font-syne), Syne, sans-serif' }}>
        {value}
      </div>
      {change && (
        <div style={{ fontSize: 11, color: changeColors[changeType], fontWeight: 500 }}>
          {changeType === 'positive' && '↑ '}
          {changeType === 'negative' && '↓ '}
          {change}
        </div>
      )}
    </div>
  )
}
