import { apiGet, apiPost } from '../../../api/client';

// 일반 목록(/api/posts)과 달리 작성자 이메일/권한 등 상세 정보를 포함한 관리자 전용 목록.
export function getAdminPostList({ page = 0, size = 10 } = {}) {
  return apiGet('/api/admin/posts', { page, size });
}

// 신고/삭제 처리된 게시글을 복구한다.
export function restorePost(postId) {
  return apiPost(`/api/admin/posts/${postId}/restore`);
}
