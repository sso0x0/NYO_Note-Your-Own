import { apiGet, apiPost, apiDelete } from '../../../api/client';

export function getLectureList({ page = 0, size = 20, categoryId, sort } = {}) {
  return apiGet('/api/lectures', { page, size, categoryId, sort });
}

// 강사(승인된 계정)가 강의 등록을 신청한다. 관리자 승인 전까지는 PENDING 상태로 본인/관리자에게만 보인다.
export function createMyLecture(request) {
  return apiPost('/api/lectures', request);
}

// 마이페이지 "강의 등록" 탭: 내가 등록 신청한 강의 목록(심사 상태 무관 전체).
export function getMyLectures(params = {}) {
  return apiGet('/api/lectures/mine', params);
}

export function getLecture(id) {
  return apiGet(`/api/lectures/${id}`);
}

// 강의 상세 페이지에 진입할 때 조회 기록을 남긴다.
// 서버에서 사용자별 하루 1회만 실제 조회수에 반영하므로 중복 호출에도 안전하다.
export function increaseLectureViewCount(id) {
  return apiPost(`/api/lectures/${id}/view`);
}

export function searchLectures({ keyword, searchType = 'all', page = 0, size = 20 } = {}) {
  return apiGet('/api/lectures/search', { keyword, searchType, page, size });
}

// 현재 로그인 사용자가 이 강의에 수강신청했는지 여부.
export function isEnrolled(id) {
  return apiGet(`/api/lectures/${id}/enroll`);
}

// 수강신청. 이미 신청했거나 정원이 마감된 경우 서버가 에러를 반환한다.
export function enrollLecture(id) {
  return apiPost(`/api/lectures/${id}/enroll`);
}

export function cancelEnrollment(id) {
  return apiDelete(`/api/lectures/${id}/enroll`);
}

// 현재 로그인 사용자가 이 강의에 좋아요를 눌렀는지 여부.
export function isLectureLiked(id) {
  return apiGet(`/api/lectures/${id}/like`);
}

export function likeLecture(id) {
  return apiPost(`/api/lectures/${id}/like`);
}

export function unlikeLecture(id) {
  return apiDelete(`/api/lectures/${id}/like`);
}
