// 백엔드 ChatController(com.nyo.domain.chat)에 대응하는 API 래퍼.
import { apiGet, apiPost } from '../../../api/client'

// 질문을 보내면 서버가 질문+답변을 모두 저장하고, 답변 메시지를 응답으로 돌려준다 (RAG).
export function sendMessage({ lectureId, message }) {
  return apiPost('/api/chats', { lectureId, message })
}

// 대화 내역 조회 (최신순). lectureId를 주면 그 강의 관련 대화만 필터링된다.
export function getHistories({ lectureId, page = 0, size = 20 } = {}) {
  return apiGet('/api/chats', { lectureId, page, size })
}
