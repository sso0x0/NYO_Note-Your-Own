import { apiGet, apiPost } from './client';

export function getLectureList({ page = 0, size = 20, categoryId } = {}) {
  return apiGet('/api/lectures', { page, size, categoryId });
}

export function getLecture(id) {
  return apiGet(`/api/lectures/${id}`);
}

// 강의 상세 페이지에 진입할 때 조회 기록을 남긴다.
// 서버에서 사용자별 하루 1회만 실제 조회수에 반영하므로 중복 호출에도 안전하다.
export function increaseLectureViewCount(id) {
  return apiPost(`/api/lectures/${id}/view`);
}
