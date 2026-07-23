import { useState } from 'react'

// 입력창 + 전송 폼. 실제 전송/응답 처리는 부모(ChatPage)의 onSend가 맡고,
// 여기서는 입력값 관리와 "전송 중"일 때 중복 제출 막는 것만 담당한다.
export default function ChatInput({ sending, onSend }) {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const message = input.trim()
    if (!message || sending) return
    setInput('') // 응답을 기다리지 않고 바로 비워서 다음 질문을 이어 입력할 수 있게 한다
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
