// 백엔드 AiTaggingController(com.nyo.domain.ai) / TagController(com.nyo.domain.tag)에 대응하는 API 래퍼.
import { apiDelete, apiGet, apiPost } from '../../../api/client'

// 이 노트에 매핑된 태그 목록 조회 (AI 생성 + 이후 수동 추가분 모두 포함)
export function getNoteTags(noteId) {
  return apiGet(`/api/notes/${noteId}/ai-tags`)
}

// 노트 본문을 OpenAI로 분석해 태그 3~5개 + 추천 카테고리를 생성. 이미 매핑된 태그는 다시 안 붙는다.
export function generateAiTags(noteId) {
  return apiPost(`/api/notes/${noteId}/ai-tags`)
}

// 작성자가 태그명을 직접 입력해 노트에 추가 (이미 있는 태그명이면 기존 태그에 매핑).
export function addNoteTag(noteId, name) {
  return apiPost(`/api/notes/${noteId}/tags`, { name })
}

// 노트에 매핑된 태그 삭제 (AI 생성분 포함, 작성자만 가능).
export function deleteNoteTag(noteId, tagId) {
  return apiDelete(`/api/notes/${noteId}/tags/${tagId}`)
}
