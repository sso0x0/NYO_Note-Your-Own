import { apiFetch, getToken, setToken, clearToken } from './client'

export function isLoggedIn() {
  return !!getToken()
}

export function logout() {
  clearToken()
}

export async function login(loginId, password) {
  const data = await apiFetch('/users/login', {
    method: 'POST',
    body: JSON.stringify({ loginId, password }),
  })
  setToken(data.accessToken)
  return data
}

export async function signup({ loginId, password, name, nickname, email, phone }) {
  return apiFetch('/users/signup', {
    method: 'POST',
    body: JSON.stringify({ loginId, password, name, nickname, email, phone, oauthProvider: 'NONE' }),
  })
}
