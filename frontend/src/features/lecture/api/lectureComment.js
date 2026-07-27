import { apiGet, apiPost, apiPut, apiDelete } from '../../../api/client';

export function getLectureComments(lectureId) {
  return apiGet(`/api/comments/lectures/${lectureId}`);
}

export function createLectureComment({ lectureId, parentCommentId, content }) {
  return apiPost('/api/comments', { lectureId, parentCommentId, content });
}

export function updateLectureComment(commentId, { lectureId, parentCommentId, content }) {
  return apiPut(`/api/comments/${commentId}`, { lectureId, parentCommentId, content });
}

export function deleteLectureComment(commentId) {
  return apiDelete(`/api/comments/${commentId}`);
}
