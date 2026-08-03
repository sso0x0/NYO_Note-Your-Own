import { apiGet, apiDelete, apiPost } from '../../../api/client';

// targetType을 주면 POST/LECTURE 중 해당 유형만, 비우면(undefined) 전체를 조회한다.
export function getCommentList({ page = 0, size = 10, targetType } = {}) {
  return apiGet('/api/admin/comments', { page, size, targetType });
}

// 삭제 권한(본인 또는 ADMIN)은 CommentService.delete에서 서버가 검증하므로 일반 댓글 삭제 API를 그대로 쓴다.
export function deleteComment(commentId) {
  return apiDelete(`/api/comments/${commentId}`);
}

// 소프트 삭제된 댓글을 복구한다.
export function restoreComment(commentId) {
  return apiPost(`/api/admin/comments/${commentId}/restore`);
}
