interface AvatarProps {
  name: string
  size?: number
  src?: string
  style?: React.CSSProperties
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Avatar({ name, size = 36, src, style }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          ...style,
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #ff2ea8, #7c3aed)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-syne), Syne, sans-serif',
        fontWeight: 700,
        fontSize: size * 0.35,
        color: '#fff',
        flexShrink: 0,
        ...style,
      }}
    >
      {getInitials(name)}
    </div>
  )
}
