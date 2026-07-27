import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { sendMessage } from './api/chat'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import '../../components/widget.css'
import './chat.css'

// 말풍선 모양의 선(line) 아이콘. 이모지(💬) 대신 다른 위젯(뽀모도로)과
// 톤을 맞춘 단색 아웃라인 아이콘을 쓰기 위해 인라인 SVG로 직접 그린다.
function CommentIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 5.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-4.5 4V16H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />
        <path d="M8 10h8M8 13h5" />
      </svg>
  )
}

// 챗봇 아이콘 + 팝업창. WidgetDock을 통해 ProtectedLayout에 한 번만 마운트되어
// 모든 /main/* 페이지에서 보인다. 대화 기록은 서버(chat_histories)에 계속 쌓이지만,
// 페이지를 이동하면 화면에는 이전 대화가 다시 뜨지 않도록 로컬 상태만 비운다.
export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const location = useLocation()

  // 다른 페이지로 이동하면 이전 페이지에서 열려 있던 대화창은 닫고 화면 상태만 초기화한다.
  // (서버에 저장된 대화 기록 자체는 지우지 않음 — 다시 불러오지 않을 뿐)
  useEffect(() => {
    setOpen(false)
    setMessages([])
    setError(null)
  }, [location.pathname])

  // 패널이 열려 있을 때만 스크롤 (닫힌 상태에서 굳이 스크롤할 필요 없음)
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const handleSend = async (message) => {
    setError(null)
    setSending(true)
    setMessages((prev) => [...prev, { id: `pending-${Date.now()}`, senderRole: 'USER', message }])

    try {
      const answer = await sendMessage({ message })
      setMessages((prev) => [...prev, answer])
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
      <div className="widget">
        {open && (
            <div className="widget__panel">
              <div className="widget__header">
                <span>학습 챗봇</span>
                <button type="button" onClick={() => setOpen(false)} aria-label="챗봇 닫기">✕</button>
              </div>
              <div className="chat-messages">
                {messages.map((m) => (
                    <ChatMessage key={m.id} senderRole={m.senderRole} message={m.message} />
                ))}
                <div ref={bottomRef} />
              </div>
              {error && <p className="chat-error">{error}</p>}
              <ChatInput sending={sending} onSend={handleSend} />
            </div>
        )}
        <button
            type="button"
            className="widget__toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? '챗봇 닫기' : '챗봇 열기'}
        >
          {open ? '✕' : <CommentIcon />}
        </button>
      </div>
  )
}
