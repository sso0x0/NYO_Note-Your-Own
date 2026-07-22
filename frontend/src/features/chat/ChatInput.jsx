import { useState } from 'react'

export default function ChatInput({ sending, onSend }) {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const message = input.trim()
    if (!message || sending) return
    setInput('')
    onSend(message)
  }

  return (
      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="질문을 입력하세요"
            disabled={sending}
        />
        <button type="submit" disabled={sending}>{sending ? '전송 중...' : '전송'}</button>
      </form>
  )
}
