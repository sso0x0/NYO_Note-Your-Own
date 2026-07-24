// 백엔드 AdminStatsController(com.nyo.domain.admin)에 대응하는 API 래퍼.
// 전부 "/api/admin/**" 하위라 ADMIN 권한 토큰이 있어야 200을 받는다.
import { apiGet } from './client'

export function getSummary() {
  return apiGet('/api/admin/stats/summary')
}

export function getLecturePopularity(limit = 10) {
  return apiGet('/api/admin/stats/lectures/popularity', { limit })
}

export function getDailySignupCounts(days = 30) {
  return apiGet('/api/admin/stats/users/daily', { days })
}

export function getDailyNoteCounts(days = 30) {
  return apiGet('/api/admin/stats/notes/daily', { days })
}
