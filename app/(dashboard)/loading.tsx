export default function DashboardLoading() {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0f',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid rgba(124,58,237,0.2)',
          borderTopColor: '#7c3aed',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ fontSize: 13, color: '#6b6b8a' }}>Cargando...</p>
      </div>
    </div>
  )
}
