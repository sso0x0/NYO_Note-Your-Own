import { apiGet, apiPatch, apiPost } from './client'

export function createRecord(payload) {
  return apiPost('/api/pomodoros', payload)
}

export function updateRecord(id, payload) {
  return apiPatch(`/api/pomodoros/${id}`, payload)
}

export function getRecords(page = 0, size = 10) {
  return apiGet('/api/pomodoros', { page, size })
}

export function getTodayStudyTime() {
  return apiGet('/api/pomodoros/stats/today')
}

export function getTotalStudyTime() {
  return apiGet('/api/pomodoros/stats/total')
}
