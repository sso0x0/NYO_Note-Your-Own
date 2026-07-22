import { useEffect, useRef, useState } from 'react'
import { getHistories, sendMessage } from '../../api/chat'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import './chat.css'

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
