import { apiFetch } from './client'

export function createRecord(payload) {
  return apiFetch('/pomodoros', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateRecord(id, payload) {
  return apiFetch(`/pomodoros/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function getRecords(page = 0, size = 10) {
  return apiFetch(`/pomodoros?page=${page}&size=${size}`)
}

export function getTodayStudyTime() {
  return apiFetch('/pomodoros/stats/today')
}

export function getTotalStudyTime() {
  return apiFetch('/pomodoros/stats/total')
}
