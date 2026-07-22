import { apiGet, apiPost } from './client'

export function sendMessage({ lectureId, message }) {
  return apiPost('/api/chats', { lectureId, message })
}

export function getHistories({ lectureId, page = 0, size = 20 } = {}) {
  return apiGet('/api/chats', { lectureId, page, size })
}
