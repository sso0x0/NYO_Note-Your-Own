import { apiFetch } from './client'

export function sendMessage({ lectureId, message }) {
  return apiFetch('/chats', { method: 'POST', body: JSON.stringify({ lectureId, message }) })
}

export function getHistories({ lectureId, page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page, size })
  if (lectureId) params.set('lectureId', lectureId)
  return apiFetch(`/chats?${params.toString()}`)
}
