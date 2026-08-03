import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { streamMessage } from './api/chat'
import ChatMessage, { SmileIcon } from './ChatMessage'
import ChatInput from './ChatInput'
import { detectStudyContext } from '../../utils/studyContext'
import '../../components/widget.css'
import './chat.css'

// 위젯을 맨 처음 열었을 때만 한 번 보여주는 환영 메시지. localStorage에 표시 여부를
// 남겨서, 페이지 이동으로 messages가 초기화된 뒤에도 다시 뜨지 않게 한다.
const WELCOME_SHOWN_KEY = 'nyo_chat_welcome_shown'
const WELCOME_MESSAGE = '안녕하세요?'

// 챗봇 아이콘 + 팝업창. 원래 WidgetDock을 통해 ProtectedLayout에 마운트되어
// 대부분의 /main/* 페이지에서 보이는 구조였으나, 지금은 WidgetDock이 빈 div만 렌더링해서
// 이 컴포넌트가 실제로는 어디서도 마운트되지 않는다(되돌리려면 WidgetDock.jsx 참고).
// 대화 기록은 서버(chat_histories)에 계속 쌓이지만,
// 페이지를 이동하면 화면에는 이전 대화가 다시 뜨지 않도록 로컬 상태만 비운다.
// 강의 시청 페이지·노트 상세 페이지는 이 위젯이 페이지 컨텍스트(lectureId/noteId)를
// 몰라서 엉뚱한 답을 할 수 있어, 대신 그 자리에 컨텍스트를 아는 전용 학습 챗봇이 있다.
// /main/chat 페이지는 이 위젯과 똑같이 컨텍스트 없이 전체 노트를 대상으로 답하지만
// 화면 전체를 쓰는 전용 페이지라 작은 팝업 위젯과 나란히 뜰 이유가 없다.
// 그래서 같은 화면에 챗봇이 두 개 뜨지 않도록 이 페이지들에서는 위젯 자체를 숨긴다.
export default function ChatWidget({ stacked = false, onOpenChange } = {}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const location = useLocation()
  const { lectureId: watchingLectureId, noteId: viewingNoteId } = detectStudyContext(location.pathname)
  const onChatPage = location.pathname.startsWith('/main/chat')
  const hasDedicatedChat = watchingLectureId !== null || viewingNoteId !== null || onChatPage

  // 위젯을 여는 동안 이어서 물어본 질문들이 서버에 하나의 대화(rootQuestionId)로 묶이게 한다 —
  // AI 챗봇 페이지(/main/chat)의 전체 대화 목록에서 새 항목으로 따로따로 안 뜨고 하나로 묶여 보인다.
  const rootQuestionIdRef = useRef(null)

  // 다른 페이지로 이동하면 이전 페이지에서 열려 있던 대화창은 닫고 화면 상태만 초기화한다.
  // (서버에 저장된 대화 기록 자체는 지우지 않음 — 다시 불러오지 않을 뿐)
  useEffect(() => {
    setOpen(false)
    setMessages([])
    setError(null)
    rootQuestionIdRef.current = null
  }, [location.pathname])

  // 패널이 열려 있을 때만 스크롤 (닫힌 상태에서 굳이 스크롤할 필요 없음)
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // 뽀모도로 위젯이 이미 열려 있을 때 이 위젯을 열면(또는 그 반대) WidgetDock이 열린 순서를
  // 알 수 있게 open 상태가 바뀔 때마다 알린다.
  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  // 위젯을 열고 닫는다. 처음 열 때(아직 환영 메시지를 보여준 적 없으면) 환영 메시지를 한 번만 넣어준다.
  const handleToggle = () => {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen && messages.length === 0 && !localStorage.getItem(WELCOME_SHOWN_KEY)) {
      setMessages([{ id: 'welcome', senderRole: 'ASSISTANT', message: WELCOME_MESSAGE }])
      localStorage.setItem(WELCOME_SHOWN_KEY, '1')
    }
  }

  // 질문을 스트리밍으로 보내고, 토큰이 도착하는 대로 답변 말풍선에 이어붙인다.
  const handleSend = async (message) => {
    setError(null)
    setSending(true)
    setMessages((prev) => [...prev, { id: `pending-${Date.now()}`, senderRole: 'USER', message }])

    // 체감 응답 속도 개선: 토큰이 도착하는 즉시 답변 자리를 만들어(최초 1회) 이어붙인다.
    // 스트림이 끝나면 서버에 저장된 최종본으로 통째로 바꿔치기한다.
    const answerId = `pending-answer-${Date.now()}`
    let streamedText = ''
    let answerCreated = false
    const appendChunk = (chunk) => {
      streamedText += chunk
      setMessages((prev) => {
        if (!answerCreated) {
          answerCreated = true
          return [...prev, { id: answerId, senderRole: 'ASSISTANT', message: streamedText }]
        }
        return prev.map((m) => (m.id === answerId ? { ...m, message: streamedText } : m))
      })
    }

    try {
      const answer = await streamMessage({ message, rootQuestionId: rootQuestionIdRef.current }, appendChunk)
      rootQuestionIdRef.current = answer.rootQuestionId
      setMessages((prev) => prev.map((m) => (m.id === answerId ? answer : m)))
    } catch (err) {
      setError(err.message)
      setMessages((prev) => prev.filter((m) => m.id !== answerId))
    } finally {
      setSending(false)
    }
  }

  // 강의 시청/노트 상세 페이지는 전용 학습 챗봇이, /main/chat은 전용 페이지가 대신하므로 이 위젯은 렌더링하지 않는다.
  if (hasDedicatedChat) return null

  return (
      <div className="widget chat-widget">
        {open && (
            <div className={`widget__panel chat-panel${stacked ? ' widget__panel--stacked' : ''}`}>
              <div className="widget__header chat-header">
                <span className="chat-header__avatar" aria-hidden="true"><SmileIcon /></span>
                <span className="chat-header__title">무엇을 도와드릴까요?</span>
                <button type="button" className="chat-header__close" onClick={() => setOpen(false)} aria-label="챗봇 닫기">✕</button>
              </div>
              <div className="chat-messages">
                {messages.map((m) => (
                    <ChatMessage key={m.id} senderRole={m.senderRole} message={m.message} recommendedLectures={m.recommendedLectures} />
                ))}
                {sending && (
                    <div className="chat-row chat-row-assistant">
                      <span className="chat-avatar" aria-hidden="true"><SmileIcon /></span>
                      <div className="chat-bubble chat-bubble-assistant chat-typing">
                        <span /><span /><span />
                      </div>
                    </div>
                )}
                <div ref={bottomRef} />
              </div>
              {error && <p className="chat-error">{error}</p>}
              <ChatInput sending={sending} onSend={handleSend} />
            </div>
        )}
        <button
            type="button"
            className="widget__toggle chat-toggle"
            onClick={handleToggle}
            aria-label={open ? '챗봇 닫기' : '챗봇 열기'}
        >
          {open ? '✕' : <SmileIcon />}
        </button>
      </div>
  )
}
