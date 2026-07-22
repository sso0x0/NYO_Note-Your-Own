// 말풍선 하나. senderRole은 백엔드 ChatHistoryResponse의 "USER" | "ASSISTANT" 값을 그대로 받아
// 색/정렬만 다르게 준다.
export default function ChatMessage({ senderRole, message }) {
  const bubbleClass = senderRole === 'USER' ? 'chat-bubble-user' : 'chat-bubble-assistant'
  return (
      <div className={`chat-bubble ${bubbleClass}`}>
        {message}
      </div>
  )
}
