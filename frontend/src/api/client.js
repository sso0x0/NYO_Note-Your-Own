const BASE_URL = '/api'
const TOKEN_KEY = 'accessToken'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const body = await res.json().catch(() => null)

  if (!res.ok || !body?.success) {
    throw new Error(body?.message || `요청 실패 (${res.status})`)
  }
  return body.data
}
