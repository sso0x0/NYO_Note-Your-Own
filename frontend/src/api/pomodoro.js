// 백엔드 PomodoroController(com.nyo.domain.pomodoro)에 대응하는 API 래퍼.
import { apiGet, apiPatch, apiPost } from './client'

// endedAt 없이 호출 = 타이머 시작(진행 중 기록 생성)
export function createRecord(payload) {
  return apiPost('/api/pomodoros', payload)
}

// endedAt을 채워서 호출 = 타이머 종료(같은 기록을 완료 상태로 갱신)
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
