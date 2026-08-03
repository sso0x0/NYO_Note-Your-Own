// 강의 댓글 CRUD API 래퍼.
import { apiGet, apiPost, apiPut, apiDelete } from '../../../api/client';

// 강의 댓글 목록 조회 (대댓글 포함).
export function getLectureComments(lectureId) {
  return apiGet(`/api/comments/lectures/${lectureId}`);
}

// 댓글 작성 (parentCommentId가 있으면 답글).
export function createLectureComment({ lectureId, parentCommentId, content }) {
  return apiPost('/api/comments', { lectureId, parentCommentId, content });
}

// 댓글 수정.
export function updateLectureComment(commentId, { lectureId, parentCommentId, content }) {
  return apiPut(`/api/comments/${commentId}`, { lectureId, parentCommentId, content });
}

// 댓글 삭제.
export function deleteLectureComment(commentId) {
  return apiDelete(`/api/comments/${commentId}`);
}
