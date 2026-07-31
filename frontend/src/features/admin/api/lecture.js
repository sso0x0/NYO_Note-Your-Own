import { apiGet } from '../../../api/client';

// 일반 목록(/api/lectures)과 달리 노트/댓글 개수를 포함한 관리자 전용 목록.
// categoryId/status를 주면 해당 조건으로 필터링하고, 비우면(undefined) 전체 강의를 조회한다.
export function getAdminLectureList({ page = 0, size = 10, categoryId, status } = {}) {
  return apiGet('/api/admin/lectures', { page, size, categoryId, status });
}
