export function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
      <div style={{
        width: 32, height: 32,
        border: '4px solid #ffe0e0',
        borderTopColor: '#ff4d4f',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export const STATUS_MAP = {
  pending: '待确认',
  confirmed: '已确认',
  preparing: '制作中',
  delivering: '配送中',
  completed: '已完成',
  cancelled: '已取消'
}

export const STATUS_OPTIONS = Object.entries(STATUS_MAP)

export function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status}`}>
      {STATUS_MAP[status] || status}
    </span>
  )
}
