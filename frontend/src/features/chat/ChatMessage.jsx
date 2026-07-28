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

// 말풍선 하나. senderRole은 백엔드 ChatHistoryResponse의 "USER" | "ASSISTANT" 값을 그대로 받아
// 정렬/색/아바타만 다르게 준다.
export default function ChatMessage({ senderRole, message }) {
  const isUser = senderRole === 'USER'
  return (
      <div className={`chat-row ${isUser ? 'chat-row-user' : 'chat-row-assistant'}`}>
        {!isUser && <span className="chat-avatar" aria-hidden="true"><SmileIcon /></span>}
        <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
          {message}
        </div>
      </div>
  )
}
