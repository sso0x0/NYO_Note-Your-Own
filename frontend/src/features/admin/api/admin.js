import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../../../api/client';

// 관리자 대시보드 통계, 회원 제재, 강의 승인/반려 등 관리자 전용 API 모음.
export function getSummary() {
  return apiGet('/api/admin/stats/summary');
}

// 인기 강의 통계(좋아요 상위 limit개)를 조회한다.
export function getLecturePopularity({ limit = 10 } = {}) {
  return apiGet('/api/admin/stats/lectures/popularity', { limit });
}

// 최근 days일간 일자별 노트 작성 수를 조회한다.
export function getDailyNoteCounts({ days = 30 } = {}) {
  return apiGet('/api/admin/stats/notes/daily', { days });
}

// 최근 days일간 일자별 회원 가입 수를 조회한다.
export function getDailySignupCounts({ days = 30 } = {}) {
  return apiGet('/api/admin/stats/users/daily', { days });
}

// 회원 목록을 페이지 단위로 조회한다.
export function getUserList({ page = 0, size = 20 } = {}) {
  return apiGet('/api/admin/users', { page, size });
}

// 회원 상세 정보를 조회한다.
export function getUser(userId) {
  return apiGet(`/api/admin/users/${userId}`);
}

// 회원의 권한(role)을 변경한다.
export function changeUserRole(userId, role) {
  return apiPatch(`/api/admin/users/${userId}/role`, { role });
}

// 회원에게 제재(경고/정지/강제 탈퇴)를 등록한다.
export function sanctionUser(request) {
  return apiPost('/api/admin/users/sanctions', request);
}

// 회원의 제재 이력을 조회한다.
export function getSanctionHistory(userId) {
  return apiGet(`/api/admin/users/${userId}/sanctions`);
}

// 회원의 정지 상태를 해제한다.
export function releaseUserSuspension(userId) {
  return apiPatch(`/api/admin/users/${userId}/suspension/release`);
}

// 새 강의를 등록한다.
export function createLecture(request) {
  return apiPost('/api/admin/lectures', request);
}

// 기존 강의 정보를 수정한다.
export function updateLecture(id, request) {
  return apiPut(`/api/admin/lectures/${id}`, request);
}

// 강의를 삭제(소프트 딜리트)한다.
export function deleteLecture(id) {
  return apiDelete(`/api/admin/lectures/${id}`);
}

// 삭제된 강의를 복구한다.
export function restoreLecture(id) {
  return apiPost(`/api/admin/lectures/${id}/restore`);
}

// 강의 등록 신청을 승인한다.
export function approveLecture(id) {
  return apiPost(`/api/admin/lectures/${id}/approve`);
}

// 강의 등록 신청을 반려한다.
export function rejectLecture(id, reason) {
  return apiPost(`/api/admin/lectures/${id}/reject`, { reason });
}
