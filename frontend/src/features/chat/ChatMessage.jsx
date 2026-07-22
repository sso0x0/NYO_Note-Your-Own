export default function ChatMessage({ senderRole, message }) {
  const bubbleClass = senderRole === 'USER' ? 'chat-bubble-user' : 'chat-bubble-assistant'
  return (
      <div className={`chat-bubble ${bubbleClass}`}>
        {message}
      </div>
  )
}
