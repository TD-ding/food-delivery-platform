const BASE = ''

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function getToken() {
  return localStorage.getItem('admin_token') || ''
}

function handleUnauthorized() {
  localStorage.removeItem('admin_token')
  if (window.location.pathname.startsWith('/admin')) {
    window.location.href = '/admin/login'
  }
}

export async function request(url, options = {}) {
  const headers = { ...options.headers }
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(options.body)
  }
  if (options.auth !== false) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${url}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (res.status === 401 && options.auth !== false) {
    handleUnauthorized()
    throw new ApiError(data.message || '登录已过期', 401)
  }

  if (!res.ok) {
    throw new ApiError(data.message || '请求失败', res.status)
  }
  return data
}

export function get(url, options = {}) {
  return request(url, { ...options, method: 'GET' })
}

export function post(url, body, options = {}) {
  return request(url, { ...options, method: 'POST', body })
}

export function put(url, body, options = {}) {
  return request(url, { ...options, method: 'PUT', body })
}

export function del(url, options = {}) {
  return request(url, { ...options, method: 'DELETE' })
}
