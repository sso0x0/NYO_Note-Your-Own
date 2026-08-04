// 강의 목록/상세/수강신청/좋아요 등 강의 도메인 API 래퍼.
import { apiGet, apiPost, apiDelete } from '../../../api/client';

// 강의 목록 조회 (카테고리/정렬/페이지 조건 적용).
export function getLectureList({ page = 0, size = 20, categoryId, sort } = {}) {
  return apiGet('/api/lectures', { page, size, categoryId, sort });
}

// 좋아요*5 + 조회수 가중치 점수 기준 인기 강의 목록 (메인 페이지 "인기 강의")
export function getPopularLectures({ page = 0, size = 10 } = {}) {
  return apiGet('/api/lectures/popular', { page, size });
}

// 강사(승인된 계정)가 강의 등록을 신청한다. 관리자 승인 전까지는 PENDING 상태로 본인/관리자에게만 보인다.
export function createMyLecture(request) {
  return apiPost('/api/lectures', request);
}

// 마이페이지 "강의 등록" 탭: 내가 등록 신청한 강의 목록(심사 상태 무관 전체).
export function getMyLectures(params = {}) {
  return apiGet('/api/lectures/mine', params);
}

// 마이페이지 "수강 강의" 탭: 내가 수강신청한 강의 목록.
export function getMyEnrolledLectures(params = {}) {
  return apiGet('/api/lectures/enrolled', params);
}

// 강의 상세 조회.
export function getLecture(id) {
  return apiGet(`/api/lectures/${id}`);
}

// 강의 상세 페이지에 진입할 때 조회 기록을 남긴다.
// 서버에서 사용자별 하루 1회만 실제 조회수에 반영하므로 중복 호출에도 안전하다.
export function increaseLectureViewCount(id) {
  return apiPost(`/api/lectures/${id}/view`);
}

// 강의 검색 (제목/내용/작성자 등 searchType 기준).
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

// 수강신청 취소.
export function cancelEnrollment(id) {
  return apiDelete(`/api/lectures/${id}/enroll`);
}

// 현재 로그인 사용자가 이 강의에 좋아요를 눌렀는지 여부.
export function isLectureLiked(id) {
  return apiGet(`/api/lectures/${id}/like`);
}

// 강의 좋아요 등록.
export function likeLecture(id) {
  return apiPost(`/api/lectures/${id}/like`);
}

// 강의 좋아요 취소.
export function unlikeLecture(id) {
  return apiDelete(`/api/lectures/${id}/like`);
}
