import { apiGet, apiPost, apiPut, apiDelete } from '../../../api/client';

// 노트 CRUD, 목록/검색/조회수/좋아요 관련 API 호출 모음

// 노트 목록 조회 (페이지네이션, 정렬, 카테고리 필터 지원)
export function getNoteList({ page = 0, size = 12, sort, categoryId } = {}) {
  return apiGet('/api/notes', { page, size, sort, categoryId });
}

// 좋아요*5 + 조회수 가중치 점수 기준 인기 노트 목록 (메인 페이지 "인기 노트")
export function getPopularNotes({ page = 0, size = 5 } = {}) {
  return apiGet('/api/notes/popular', { page, size });
}

// 특정 카테고리에 속한 노트 목록 조회
export function getNoteListByCategory({ categoryId, page = 0, size = 6, sort } = {}) {
  return apiGet('/api/notes', { categoryId, page, size, sort });
}

// 키워드로 노트 검색 (제목/본문/태그 등 searchType에 따라 대상 구분)
export function searchNotes({ keyword, searchType = 'all', page = 0, size = 12 } = {}) {
  return apiGet('/api/notes/search', { keyword, searchType, page, size });
}

// 특정 강의에 연결된 노트 목록 조회
export function getNotesByLecture(lectureId) {
  return apiGet(`/api/notes/lectures/${lectureId}`);
}

// 로그인 사용자 본인이 작성한 노트 목록 조회
export function getMyNotes({ page = 0, size = 12 } = {}) {
  return apiGet('/api/notes/mine', { page, size });
}

// 로그인 사용자가 좋아요한 노트 목록 조회
export function getLikedNotes({ page = 0, size = 12 } = {}) {
  return apiGet('/api/notes/liked', { page, size });
}

// 노트 상세 조회
export function getNote(noteId) {
  return apiGet(`/api/notes/${noteId}`);
}

// 노트 생성
export function createNote(request) {
  return apiPost('/api/notes', request);
}

// 노트 수정
export function updateNote(noteId, request) {
  return apiPut(`/api/notes/${noteId}`, request);
}

// 노트 삭제
export function deleteNote(noteId) {
  return apiDelete(`/api/notes/${noteId}`);
}

// 노트 조회수 증가
export function increaseNoteViewCount(noteId) {
  return apiPost(`/api/notes/${noteId}/view`);
}

// 로그인 사용자가 이 노트를 좋아요했는지 여부 조회
export function isNoteLiked(noteId) {
  return apiGet(`/api/notes/${noteId}/like`);
}

// 노트 좋아요 등록
export function likeNote(noteId) {
  return apiPost(`/api/notes/${noteId}/like`);
}

// 노트 좋아요 취소
export function unlikeNote(noteId) {
  return apiDelete(`/api/notes/${noteId}/like`);
}
