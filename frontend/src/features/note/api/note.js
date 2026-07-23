import { apiGet, apiPost, apiPut, apiDelete } from '../../../api/client';

export function getNoteList({ page = 0, size = 12, sort } = {}) {
  return apiGet('/api/notes', { page, size, sort });
}

export function searchNotes({ keyword, page = 0, size = 12 } = {}) {
  return apiGet('/api/notes/search', { keyword, page, size });
}

export function getNotesByLecture(lectureId) {
  return apiGet(`/api/notes/lectures/${lectureId}`);
}

export function getMyNotes({ page = 0, size = 12 } = {}) {
  return apiGet('/api/notes/mine', { page, size });
}

export function getLikedNotes({ page = 0, size = 12 } = {}) {
  return apiGet('/api/notes/liked', { page, size });
}

export function getNote(noteId) {
  return apiGet(`/api/notes/${noteId}`);
}

export function createNote(request) {
  return apiPost('/api/notes', request);
}

export function updateNote(noteId, request) {
  return apiPut(`/api/notes/${noteId}`, request);
}

export function deleteNote(noteId) {
  return apiDelete(`/api/notes/${noteId}`);
}

export function increaseNoteViewCount(noteId) {
  return apiPost(`/api/notes/${noteId}/view`);
}

export function isNoteLiked(noteId) {
  return apiGet(`/api/notes/${noteId}/like`);
}

export function likeNote(noteId) {
  return apiPost(`/api/notes/${noteId}/like`);
}

export function unlikeNote(noteId) {
  return apiDelete(`/api/notes/${noteId}/like`);
}
