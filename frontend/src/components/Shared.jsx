import React from 'react'

export function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="loading-spinner-dot" />
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

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <h3 style={{ marginBottom: 12, color: '#ff4d4f' }}>页面出错了</h3>
          <p>请刷新页面重试</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 12, padding: '8px 20px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            刷新页面
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
