// 말풍선 하나. senderRole은 백엔드 ChatHistoryResponse의 "USER" | "ASSISTANT" 값을 그대로 받아
// 정렬/색/아바타만 다르게 준다.
export default function ChatMessage({ senderRole, message }) {
  const isUser = senderRole === 'USER'
  return (
      <div className={`chat-row ${isUser ? 'chat-row-user' : 'chat-row-assistant'}`}>
        {!isUser && <span className="chat-avatar" aria-hidden="true" />}
        <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
          {message}
        </div>
      </div>
  )
}
