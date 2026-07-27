import { apiGet } from '../../../api/client';

// 일반 목록(/api/notes)과 달리 작성자 이메일/권한 등 상세 정보를 포함한 관리자 전용 목록.
export function getAdminNoteList({ page = 0, size = 10 } = {}) {
  return apiGet('/api/admin/notes', { page, size });
}
