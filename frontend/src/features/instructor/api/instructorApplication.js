// 강사 신청 생성/내 신청 조회와, 관리자의 신청 목록 조회·승인·반려를 처리하는 API 함수 모음
import { apiGet, apiPost } from '../../../api/client';

// 강사 신청서를 제출한다.
export function createInstructorApplication(request) {
  return apiPost('/api/instructor-applications', request);
}

// 내가 제출한 강사 신청 목록을 조회한다.
export function getMyInstructorApplications(params = {}) {
  return apiGet('/api/instructor-applications/me', params);
}

// (관리자) 전체 강사 신청 목록을 조회한다.
export function getAdminInstructorApplications(params = {}) {
  return apiGet('/api/admin/instructor-applications', params);
}

// (관리자) 강사 신청을 승인한다.
export function approveInstructorApplication(applicationId) {
  return apiPost(`/api/admin/instructor-applications/${applicationId}/approve`);
}

// (관리자) 강사 신청을 반려한다.
export function rejectInstructorApplication(applicationId, reason) {
  return apiPost(`/api/admin/instructor-applications/${applicationId}/reject`, { reason });
}
