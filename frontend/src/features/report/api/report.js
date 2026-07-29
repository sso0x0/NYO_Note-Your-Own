import { apiGet, apiPost } from '../../../api/client'

// 일반 사용자의 신고 등록 API. 신고자 ID는 서버가 JWT에서 결정한다.
export function createReport(targetType, targetId, reason) {
  return apiPost('/api/reports', { targetType, targetId, reason })
}

// 관리자 페이지에서 최신 신고 목록을 페이지 단위로 조회한다.
export function getAdminReports({ page = 0, size = 10 } = {}) {
  return apiGet('/api/admin/reports', { page, size })
}

export function markReportReviewed(reportId) {
  return apiPost(`/api/admin/reports/${reportId}/review`)
}
