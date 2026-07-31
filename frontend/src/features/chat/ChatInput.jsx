import { useLayoutEffect, useRef, useState } from 'react'

// 종이비행기 전송 아이콘. 다른 위젯 아이콘들과 톤을 맞춘 단색 아웃라인 SVG.
function SendIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 2 11 13" />
        <path d="M22 2 15 22l-4-9-9-4Z" />
      </svg>
  )
}

// 스트리밍 중단 아이콘 (채워진 사각형 — 미디어 플레이어의 정지 버튼 관례를 그대로 따름).
function StopIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
  )
}

// 두 줄 정도까지만 자연스럽게 커지고, 그 이상은 창 크기를 고정한 채 안에서만 스크롤되게 하는 상한.
const MAX_TEXTAREA_HEIGHT = 64

// 입력창 + 전송 폼. 실제 전송/응답 처리는 부모(ChatPage)의 onSend가 맡고,
// 여기서는 입력값 관리와 "전송 중"일 때 중복 제출 막는 것만 담당한다.
// input이 아니라 textarea를 써서 여러 줄 질문(코드 포함 등)을 편하게 입력할 수 있게 했다:
// Enter는 전송, Shift+Enter는 줄바꿈 — 대부분의 채팅형 UI가 따르는 관례를 그대로 따른다.
export default function ChatInput({ sending, onSend, onStop }) {
  const [input, setInput] = useState('')
  const textareaRef = useRef(null)

  // 입력값이 바뀔 때마다 높이를 한 줄로 되돌린 뒤 scrollHeight만큼 다시 늘려서
  // "줄이 늘어나면 커지고, 지우면 다시 줄어드는" 자연스러운 자동 높이 조절을 만든다.
  // 두 줄(MAX_TEXTAREA_HEIGHT)을 넘어가면 창 자체는 더 안 늘어나고 안에서 스크롤된다 —
  // 그래야 길게 쓸 때 입력창이 한없이 넓어져 보이는 이질감이 없다.
  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
  }, [input])

  const submit = () => {
    const message = input.trim()
    if (!message || sending) return
    setInput('') // 응답을 기다리지 않고 바로 비워서 다음 질문을 이어 입력할 수 있게 한다
    onSend(message)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submit()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
      <form className="chat-input-row" onSubmit={handleSubmit}>
        <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="질문을 입력하세요 (Shift+Enter로 줄바꿈)"
            disabled={sending}
        />
        {sending && (
            // 전송 버튼과는 별도로, 전송 중일 때만 옆에 나타나는 중단 버튼.
            <button type="button" className="chat-stop" onClick={onStop} aria-label="중단">
              <StopIcon />
            </button>
        )}
        <button type="submit" className="chat-send" disabled={sending} aria-label="전송">
          <SendIcon />
        </button>
      </form>
  )
}
