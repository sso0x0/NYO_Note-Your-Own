// 백엔드 AdminStatsController(com.nyo.domain.admin)에 대응하는 API 래퍼.
// 전부 "/api/admin/**" 하위라 ADMIN 권한 토큰이 있어야 200을 받는다.
import { apiGet } from './client'

// 관리자 대시보드 요약 통계(회원/강의/노트 등)를 가져온다.
export function getSummary() {
  return apiGet('/api/admin/stats/summary')
}

// 인기 강의 순위를 상위 limit개 가져온다.
export function getLecturePopularity(limit = 10) {
  return apiGet('/api/admin/stats/lectures/popularity', { limit })
}

// 최근 days일간 일별 회원가입 수를 가져온다.
export function getDailySignupCounts(days = 30) {
  return apiGet('/api/admin/stats/users/daily', { days })
}

// 최근 days일간 일별 노트 작성 수를 가져온다.
export function getDailyNoteCounts(days = 30) {
  return apiGet('/api/admin/stats/notes/daily', { days })
}
