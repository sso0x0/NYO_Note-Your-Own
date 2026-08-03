// 백엔드 PomodoroController(com.nyo.domain.pomodoro)에 대응하는 API 래퍼.
import { apiDelete, apiGet, apiPatch, apiPost } from '../../../api/client'

// 타이머가 끝났을 때(시작~종료를 한 번에 담아) 완성된 기록을 저장한다.
export function createRecord(payload) {
  return apiPost('/api/pomodoros', payload)
}

// 기록 수정 (관리자/마이페이지 등에서 이미 저장된 기록을 고칠 때 사용).
export function updateRecord(id, payload) {
  return apiPatch(`/api/pomodoros/${id}`, payload)
}

// 기록 목록 페이지 조회 (최신순).
export function getRecords(page = 0, size = 10) {
  return apiGet('/api/pomodoros', { page, size })
}

// 오늘 하루 누적 집중 시간(분) 조회.
export function getTodayStudyTime() {
  return apiGet('/api/pomodoros/stats/today')
}

// 기간별 조회 (startDate~endDate, 최신순). 마이페이지의 학습 기록 조회에 사용.
export function getRecordsByPeriod({ startDate, endDate, page = 0, size = 100 } = {}) {
  return apiGet('/api/pomodoros/period', { startDate, endDate, page, size })
}

// 누적(전체 기간) 총 집중 시간 조회.
export function getTotalStudyTime() {
  return apiGet('/api/pomodoros/stats/total')
}

// 기록 단건 삭제.
export function deleteRecord(id) {
  return apiDelete(`/api/pomodoros/${id}`)
}

// 기록 다건(선택) 삭제.
export function deleteRecords(ids) {
  return apiDelete('/api/pomodoros', { ids })
}

// 기록 전체 삭제.
export function deleteAllRecords() {
  return apiDelete('/api/pomodoros/all')
}
