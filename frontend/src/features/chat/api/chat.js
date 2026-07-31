// 백엔드 ChatController(com.nyo.domain.chat)에 대응하는 API 래퍼.
import { apiDelete, apiGet, apiPost, getStoredToken, handleUnauthorized } from '../../../api/client'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin

// 질문을 보내면 서버가 질문+답변을 모두 저장하고, 답변 메시지를 응답으로 돌려준다 (RAG).
// rootQuestionId: 이 질문이 이어서 하는 대화의 루트 질문 id (없으면 이 질문 자체가 새 대화의 시작이 되고,
// 응답의 rootQuestionId로 이 질문 자신의 id가 내려온다 — 그 값을 다음 질문에 계속 실어 보내면 같은
// 대화로 묶여서, 대화 목록에는 새 항목으로 안 뜨고 그 대화를 열었을 때만 이어서 보인다).
export function sendMessage({ lectureId, noteId, noteIds, message, rootQuestionId }) {
  return apiPost('/api/chats', { lectureId, noteId, noteIds, message, rootQuestionId })
}

// sendMessage와 같은 답을 받아오지만, 토큰(델타) 단위로 받는 즉시 onChunk로 흘려보내
// 화면에서 타이핑되듯 보이게 한다 (체감 응답 속도 개선).
// EventSource는 커스텀 헤더(Authorization)를 못 보내 fetch로 직접 SSE를 읽는다.
// 반환값은 서버에 최종 저장된 답변(sendMessage와 동일한 형태) — 스트리밍이 끝나면
// 화면에 누적해온 원문을 이 최종본으로 바꿔치기해서 따옴표 치환 등이 반영되게 한다.
// signal: AbortSignal을 넘기면 응답을 기다리는 도중이든 스트리밍을 읽는 도중이든
// 언제든 중단할 수 있다 (fetch가 AbortError를 던지며 즉시 정리됨). 호출부(ChatPage)가
// "중단" 버튼에서 이 signal의 컨트롤러를 abort()한다.
export async function streamMessage({ lectureId, noteId, noteIds, message, rootQuestionId }, onChunk, { signal } = {}) {
  const token = getStoredToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(new URL('/api/chats/stream', BASE_URL), {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ lectureId, noteId, noteIds, message, rootQuestionId }),
    signal,
  })
  if (res.status === 401 && token) {
    // apiGet/apiPost 등과 동일하게, 토큰을 실어 보냈는데도 401이면 세션 만료로 보고 로그인 화면으로 보낸다.
    // 이걸 빼먹으면 토큰 만료 시 다른 화면은 다 로그인으로 튕기는데 챗봇만 화면에 에러 문구가 남는다.
    handleUnauthorized()
  }
  if (!res.ok || !res.body) {
    const payload = await res.json().catch(() => null)
    throw new Error(payload?.message || `요청 실패 (${res.status}): /api/chats/stream`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done: readerDone, value } = await reader.read()
    if (readerDone) break
    buffer += decoder.decode(value, { stream: true })

    // SSE 이벤트는 빈 줄로 구분된다. "event: 이름\ndata: 내용" 쌍을 하나씩 떼어 처리한다.
    let sepIndex
    while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex)
      buffer = buffer.slice(sepIndex + 2)

      let eventName = 'message'
      const dataLines = []
      for (const line of rawEvent.split('\n')) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim()
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
      }
      const data = dataLines.join('\n')
      if (!data) continue

      if (eventName === 'chunk') {
        onChunk(JSON.parse(data))
      } else if (eventName === 'done') {
        // "done"을 받으면 그 자리에서 바로 반환한다 — reader.read()가 스트림 종료(EOF)를
        // 알려주길 더 기다리지 않는다. 서버가 응답을 다 보낸 뒤 연결을 정리하는 과정에서
        // (비동기 디스패치 등) 지연/오류가 나도, 정작 필요한 데이터는 이미 다 받았으니
        // 여기서 안 멈추고 끝낼 수 있다.
        reader.cancel().catch(() => {})
        return JSON.parse(data)
      }
    }
  }

  throw new Error('챗봇 응답을 받지 못했습니다.')
}

// 대화 내역 조회 (최신순). lectureId를 주면 그 강의 관련 대화만 필터링된다.
export function getHistories({ lectureId, page = 0, size = 20 } = {}) {
  return apiGet('/api/chats', { lectureId, page, size })
}

// 선택 삭제 (ids 목록)
export function deleteHistories(ids) {
  return apiDelete('/api/chats', { ids })
}

// 전체 삭제
export function deleteAllHistories() {
  return apiDelete('/api/chats/all')
}
