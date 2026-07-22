import { useEffect, useRef, useState } from 'react'
import { getHistories, sendMessage } from '../../api/chat'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import './chat.css'

// /main/chat 라우트. 노트 기반 RAG 챗봇 화면 — 진입 시 지난 대화 내역을 불러오고,
// 질문을 보내면 사용자 메시지를 먼저 화면에 붙인 뒤(낙관적 업데이트) 백엔드가
// 저장 + OpenAI 호출까지 마친 답변을 받아 이어 붙인다.
export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  // 대화 내역은 최신순(id desc)으로 내려오므로, 위에서부터 오래된 순으로 보이도록 뒤집는다
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await getHistories()
        if (!cancelled) setMessages([...res.content].reverse())
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // 메시지가 추가될 때마다 최신 메시지가 보이도록 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 사용자 메시지는 서버 응답을 기다리지 않고 바로 화면에 보여준다 (id는 임시 값이라
  // 서버에 실제로 저장된 값과는 다르지만, 이 화면에서 그 메시지를 다시 참조할 일이 없어 문제 없음).
  // AI 응답은 몇 초 걸릴 수 있어 그동안 sending으로 중복 전송을 막는다.
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
      <div className="chat-page">
        <h1>학습 챗봇</h1>
        <div className="chat-messages">
          {messages.map((m) => (
              <ChatMessage key={m.id} senderRole={m.senderRole} message={m.message} />
          ))}
          <div ref={bottomRef} />
        </div>
        {error && <p className="chat-error">{error}</p>}
        <ChatInput sending={sending} onSend={handleSend} />
      </div>
  )
}
