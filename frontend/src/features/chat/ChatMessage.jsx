import { Link } from 'react-router-dom'

// 웃는 얼굴 아이콘. 챗봇 토글 버튼과 아바타 원 모두 이 아이콘 하나로 통일해서 쓴다
// (말풍선 테두리 없이 표정만 — 원/동그라미 모양은 각 위치의 CSS가 담당).
export function SmileIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 10.5v.01M15 10.5v.01" />
        <path d="M9 14Q12 16.3 15 14" />
      </svg>
  )
}

// 메시지 안의 ```코드블럭```만 골라 <pre><code>로 감싸고, 나머지 일반 텍스트는
// 그대로 둔다. 서버가 백틱 펜스를 지켜서 보내주므로(ChatService.sanitizeQuotesOutsideCodeBlocks)
// 여기서는 그 펜스를 찾아 렌더링만 바꿔주면 된다. 닫는 ```가 없어도(끊긴 응답 등) 깨지지 않도록
// 마지막 코드블럭은 파일 끝까지로 처리한다.
function renderMessageContent(message) {
  const CODE_BLOCK = /```(\w+)?\n?([\s\S]*?)(?:```|$)/g
  const nodes = []
  let lastIndex = 0
  let match

  while ((match = CODE_BLOCK.exec(message)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={nodes.length}>{message.slice(lastIndex, match.index)}</span>)
    }
    const lang = match[1] || ''
    const code = match[2].replace(/\n$/, '')
    nodes.push(
        <pre key={nodes.length} className="chat-bubble__code">
          {lang && <span className="chat-bubble__code-lang">{lang}</span>}
          <code>{code}</code>
        </pre>
    )
    lastIndex = CODE_BLOCK.lastIndex
  }
  if (lastIndex < message.length) {
    nodes.push(<span key={nodes.length}>{message.slice(lastIndex)}</span>)
  }
  return nodes
}

// 말풍선 하나. senderRole은 백엔드 ChatHistoryResponse의 "USER" | "ASSISTANT" 값을 그대로 받아
// 정렬/색/아바타만 다르게 준다.
// recommendedLectures: 강의 추천 답변일 때만 백엔드가 채워 보내는 실제 강의 목록(id·제목 등).
// AI가 쓴 텍스트를 파싱해서 링크로 바꾸는 대신, 이 구조화된 데이터로 바로 이동 버튼을 만든다
// (모델이 제목을 살짝 바꿔 말해도 안전하게 동작하도록).
export default function ChatMessage({ senderRole, message, recommendedLectures }) {
  const isUser = senderRole === 'USER'
  return (
      <div className={`chat-row ${isUser ? 'chat-row-user' : 'chat-row-assistant'}`}>
        {!isUser && <span className="chat-avatar" aria-hidden="true"><SmileIcon /></span>}
        <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
          {message.includes('```') ? renderMessageContent(message) : message}
          {recommendedLectures?.length > 0 && (
              <div className="chat-bubble__lectures">
                {recommendedLectures.map((lecture) => (
                    <Link key={lecture.id} to={`/main/lectures/${lecture.id}`} className="chat-bubble__lecture-link">
                      {lecture.title} →
                    </Link>
                ))}
              </div>
          )}
        </div>
      </div>
  )
}
