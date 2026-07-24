import { useEffect, useRef, useState } from 'react'
import { parseTextColors } from '../../../utils/textColor'
import { useAuth } from '../../../context/AuthContext'
import { parseMainImage } from '../../../utils/mainImage'
import { generateAiTags, getNoteTags } from '../api/tag'
import { getHistories, sendMessage } from '../../chat/api/chat'
import ChatMessage from '../../chat/ChatMessage'
import ChatInput from '../../chat/ChatInput'
import '../../chat/chat.css'

const EMPTY_HEART_IMAGE = '/images/heart.png'
const FILLED_HEART_IMAGE = '/images/hearts.png'

function NoteDetailChat({ lectureId }) {
  const [chatMessages, setChatMessages] = useState([])
  const [chatSending, setChatSending] = useState(false)
  const [chatError, setChatError] = useState(null)
  const chatBottomRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setChatMessages([])
    setChatError(null)

    // 연결된 강의와 같은 대화 기록을 조회해 양쪽 화면에서 동일한 내용을 보여줍니다.
    getHistories({ lectureId })
      .then((response) => {
        if (!cancelled) setChatMessages([...(response?.content ?? [])].reverse())
      })
      .catch((error) => {
        if (!cancelled) setChatError(error.message)
      })

    return () => {
      cancelled = true
    }
  }, [lectureId])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleChatSend = async (message) => {
    setChatError(null)
    setChatSending(true)
    setChatMessages((previous) => [
      ...previous,
      { id: `pending-${Date.now()}`, senderRole: 'USER', message },
    ])

    try {
      // 연결된 강의 ID로 저장해 노트와 강의 화면에서 같은 대화를 이어갑니다.
      const answer = await sendMessage({ lectureId, message })
      setChatMessages((previous) => [...previous, answer])
    } catch (error) {
      setChatError(error.message)
    } finally {
      setChatSending(false)
    }
  }

  return (
    <aside className="note-detail-chat">
      <div className="note-detail-chat__header">학습 챗봇</div>
      <div className="chat-messages">
        {chatMessages.map((chatMessage) => (
          <ChatMessage
            key={chatMessage.id}
            senderRole={chatMessage.senderRole}
            message={chatMessage.message}
          />
        ))}
        <div ref={chatBottomRef} />
      </div>
      {chatError && <p className="chat-error">{chatError}</p>}
      <ChatInput sending={chatSending} onSend={handleChatSend} />
    </aside>
  )
}

function NoteDetail({ noteId, onBack, onEdit }) {
  const { auth } = useAuth()
  const [note, setNote] = useState(null)
  const [message, setMessage] = useState('노트를 불러오는 중입니다.')
  const [loading, setLoading] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [tags, setTags] = useState([])
  const [tagGenerating, setTagGenerating] = useState(false)
  const [tagError, setTagError] = useState(null)
  const userId = auth?.userId

  const loadNote = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(`노트 상세 조회 실패: HTTP ${response.status}`)
        return
      }

      setNote(data)
      setMessage('')
    } catch (error) {
      setMessage(`노트 상세 조회 실패: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadLikeStatus = async () => {
    const response = await fetch(`/api/notes/${noteId}/like`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    })
    if (response.ok) setLiked(await response.json())
  }

  const loadTags = async () => {
    try {
      setTags(await getNoteTags(noteId))
    } catch (error) {
      // 태그 조회는 부가 정보라 실패해도 노트 본문 표시를 막지 않는다.
      setTagError(error.message)
    }
  }

  useEffect(() => {
    const increaseViewCount = async () => {
      // 상세 페이지에 들어오면 common.view_logs로 하루 1회만 조회수를 올린다.
      await fetch(`/api/notes/${noteId}/view?userId=${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      })
    }

    const load = async () => {
      // 조회수나 좋아요 상태 요청 하나가 실패해도 노트 본문 조회까지 중단되지 않게 독립 실행합니다.
      await Promise.allSettled([increaseViewCount(), loadNote(), loadLikeStatus(), loadTags()])
    }

    load()
  }, [noteId])

  const toggleLike = async () => {
    if (likeLoading) return
    setLikeLoading(true)
    try {
      // 현재 상태에 따라 한 버튼이 좋아요 등록(POST)과 취소(DELETE)를 번갈아 수행합니다.
      const response = await fetch(`/api/notes/${noteId}/like`, {
        method: liked ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      })
      if (!response.ok) {
        setMessage(`좋아요 처리 실패: HTTP ${response.status}`)
        return
      }
      setLiked((previous) => !previous)
      await loadNote()
    } finally {
      setLikeLoading(false)
    }
  }

  const handleGenerateTags = async () => {
    if (tagGenerating) return
    setTagGenerating(true)
    setTagError(null)
    try {
      await generateAiTags(noteId)
      await loadTags()
    } catch (error) {
      setTagError(error.message)
    } finally {
      setTagGenerating(false)
    }
  }

  const exportNotePdf = () => {
    if (!note) {
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      setMessage('PDF 창을 열 수 없습니다. 브라우저 팝업 차단을 확인하세요.')
      return
    }

    // 제목, 메인 이미지, 내용을 출력용 HTML로 만들어 브라우저의 PDF 저장 기능을 사용한다.
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(note.title)}</title>
          <style>
            body { max-width: 760px; margin: 40px auto; font-family: Arial, sans-serif; color: #222; }
            h1 { margin: 0 0 24px; font-size: 28px; }
            img { max-width: 100%; margin: 16px 0; border-radius: 6px; }
            p { white-space: pre-wrap; line-height: 1.65; }
            pre { padding: 14px; overflow-x: auto; border-radius: 6px; background: #1f2933; color: #f7fafc; }
            code { font-family: Consolas, Monaco, monospace; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(note.title)}</h1>
          ${note.thumbnailUrl ? `<img src="${escapeAttribute(note.thumbnailUrl)}" alt="메인 이미지" />` : ''}
          ${createPrintableContent(note.content)}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const deleteNote = async () => {
    if (!window.confirm('노트를 삭제할까요?')) {
      return
    }

    setLoading(true)
    try {
      // 노트 삭제 API를 호출하면 백엔드에서 연결된 GCS 이미지도 같이 삭제한다.
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      })

      if (!response.ok) {
        setMessage(`노트 삭제 실패: HTTP ${response.status}`)
        return
      }

      onBack()
    } catch (error) {
      setMessage(`노트 삭제 실패: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (value) => {
    if (!value) return '-'
    return new Date(value).toLocaleString()
  }

  // 삭제 버튼은 작성자 본인 또는 로그인 정보의 DB 역할이 ADMIN인 경우에만 표시합니다.
  const canDelete = note && auth && (
    String(note.userId) === String(auth.userId) || auth.role === 'ADMIN'
  )
  // 수정은 관리자 권한과 관계없이 노트를 작성한 로그인 사용자 본인에게만 허용합니다.
  const canEdit = note && auth && String(note.userId) === String(auth.userId)
  const mainImage = parseMainImage(note?.thumbnailUrl)

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

  const escapeAttribute = (value) => escapeHtml(value)

  const createPrintableContent = (content) => {
    // PDF 출력 화면에서도 본문 이미지와 코드블럭을 실제 이미지/코드 영역으로 변환한다.
    return String(content ?? '').split('```').map((part, index) => {
      if (index % 2 === 1) {
        return `<pre><code>${escapeHtml(part.trim())}</code></pre>`
      }

      return createPrintableTextWithImages(part)
    }).join('')
  }

  const createPrintableTextWithImages = (text) => {
    const imagePattern = /!\[[^\]]*]\((https?:\/\/[^)]+)\)(?:\{width=(\d+)\})?/g
    let html = ''
    let lastIndex = 0
    let match

    while ((match = imagePattern.exec(text)) !== null) {
      const textBeforeImage = text.slice(lastIndex, match.index)
      if (textBeforeImage) {
        html += `<p>${createPrintableColoredText(textBeforeImage)}</p>`
      }

      html += `<img src="${escapeAttribute(match[1])}" alt="본문 이미지" />`
      lastIndex = match.index + match[0].length
    }

    const restText = text.slice(lastIndex)
    if (restText) {
      html += `<p>${createPrintableColoredText(restText)}</p>`
    }

    return html
  }

  const createPrintableColoredText = (text) => parseTextColors(text)
    .map((part) => part.color
      ? `<span style="color: ${part.color}">${escapeHtml(part.text)}</span>`
      : escapeHtml(part.text))
    .join('')

  const renderNoteContent = (content) => {
    // 저장된 본문에서 ```로 감싼 부분은 코드블럭으로 분리해서 보여준다.
    return content.split('```').map((part, index) => {
      if (index % 2 === 1) {
        return (
          <pre className="note-code-block" key={index}>
            <code>{part.trim()}</code>
          </pre>
        )
      }

      return renderTextWithImages(part, `note-text-${index}`)
    })
  }

  const renderTextWithImages = (text, keyPrefix) => {
    const imagePattern = /!\[[^\]]*]\((https?:\/\/[^)]+)\)(?:\{width=(\d+)\})?/g
    const blocks = []
    let lastIndex = 0
    let match

    while ((match = imagePattern.exec(text)) !== null) {
      const textBeforeImage = text.slice(lastIndex, match.index)
      if (textBeforeImage) {
        blocks.push(
          <p className="note-text-block" key={`${keyPrefix}-text-${blocks.length}`}>
            {renderColoredText(textBeforeImage, `${keyPrefix}-color-${blocks.length}`)}
          </p>
        )
      }

      blocks.push(
        <img
          className="content-inline-image"
          src={match[1]}
          style={match[2] ? { width: `${match[2]}px` } : undefined}
          draggable={false}
          alt="본문 이미지"
          key={`${keyPrefix}-image-${blocks.length}`}
        />
      )
      lastIndex = match.index + match[0].length
    }

    const restText = text.slice(lastIndex)
    if (restText) {
      blocks.push(
        <p className="note-text-block" key={`${keyPrefix}-text-rest`}>
          {renderColoredText(restText, `${keyPrefix}-color-rest`)}
        </p>
      )
    }

    return blocks
  }

  const renderColoredText = (text, keyPrefix) => (
    // 글자색 기능: #RRGGBB 형식으로 검증된 값만 React style에 전달합니다.
    parseTextColors(text).map((part, index) => (
      <span style={part.color ? { color: part.color } : undefined} key={`${keyPrefix}-${index}`}>
        {part.text}
      </span>
    ))
  )

  return (
    <>
      <header className="note-header">
        <div>
          <h1>노트 상세</h1>
          <p>선택한 노트의 내용을 확인합니다.</p>
        </div>
        <div className="note-header-actions">
          {note && <button type="button" onClick={exportNotePdf}>PDF 저장</button>}
          {canEdit && <button type="button" onClick={() => onEdit(note.id)}>수정</button>}
          {canDelete && <button type="button" className="danger-button" onClick={deleteNote} disabled={loading}>삭제</button>}
          <button type="button" onClick={onBack}>목록</button>
        </div>
      </header>

      <div className="note-detail-layout">
        <article className="note-detail-panel">
        {note ? (
          <>
            {/* 게시판 상세처럼 제목 아래에 작성자·강의·수정일·조회수를 한 줄로 표시한다. */}
            <h1 className="post-detail-title">{note.title}</h1>
            <p className="post-detail-byline note-detail-byline">
              <strong>{note.authorNickname || '알 수 없는 사용자'}</strong>
              <span aria-hidden="true"> | </span>
              <span>{note.lectureTitle || '강의 정보 없음'}</span>
              <span aria-hidden="true"> | </span>
              <time dateTime={note.updatedAt}>최종 수정일 {formatDate(note.updatedAt)}</time>
              <span aria-hidden="true"> | </span>
              <span>조회수 {note.viewCount ?? 0}</span>
            </p>

            <div className="note-tags">
              {tags.map((tag) => (
                  <span key={tag.tagId} className="note-tag-chip">
                    {tag.isAiGenerated && <span className="note-tag-chip__ai">AI</span>}
                    {tag.tagName}
                  </span>
              ))}
              {canEdit && (
                  <button
                      type="button"
                      className="note-tag-generate"
                      onClick={handleGenerateTags}
                      disabled={tagGenerating}
                  >
                    {tagGenerating ? 'AI 태그 생성 중...' : (tags.length > 0 ? 'AI 태그 다시 생성' : 'AI 태그 생성')}
                  </button>
              )}
            </div>
            {tagError && <p className="note-tag-error">{tagError}</p>}

            <dl className="note-meta">
              <div>
                <dt>노트 ID</dt>
                <dd>{note.id}</dd>
              </div>
              <div>
                <dt>강의 ID</dt>
                <dd>{note.lectureId}</dd>
              </div>
              <div>
                <dt>작성자 ID</dt>
                <dd>{note.userId}</dd>
              </div>
              <div>
                <dt>최종 수정일</dt>
                <dd>{formatDate(note.updatedAt)}</dd>
              </div>
              <div>
                <dt>조회수</dt>
                <dd>{note.viewCount}</dd>
              </div>
              <div>
                <dt>좋아요</dt>
                <dd>{note.likeCount}</dd>
              </div>
            </dl>

            <div className="note-header-actions legacy-note-like">
              <button
                type="button"
                className="like-icon-button"
                onClick={toggleLike}
                disabled={likeLoading}
                aria-label={liked ? '좋아요 취소' : '좋아요'}
                aria-pressed={liked}
              >
                <img src={liked ? FILLED_HEART_IMAGE : EMPTY_HEART_IMAGE} alt="" draggable={false} />
              </button>
            </div>

            {/* 노트 상세 화면의 이미지를 마우스로 끌어서 복사하지 못하게 합니다. */}
            {mainImage.url && (
              <img
                className="note-thumbnail"
                src={mainImage.url}
                style={{ width: `${mainImage.width}px` }}
                alt=""
                draggable={false}
              />
            )}
            <div className="note-content">{renderNoteContent(note.content)}</div>

            {/* 본문 아래에서 좋아요 버튼과 현재 좋아요 수를 함께 보여준다. */}
            <div className="note-like-summary">
              <button
                type="button"
                className="like-icon-button"
                onClick={toggleLike}
                disabled={likeLoading}
                aria-label={liked ? '좋아요 취소' : '좋아요'}
                aria-pressed={liked}
              >
                <img src={liked ? FILLED_HEART_IMAGE : EMPTY_HEART_IMAGE} alt="" draggable={false} />
              </button>
              <span>좋아요 {note.likeCount ?? 0}</span>
            </div>
          </>
        ) : (
          <p>{loading ? '불러오는 중입니다.' : message}</p>
        )}
        </article>
        {note?.lectureId && <NoteDetailChat lectureId={note.lectureId} />}
      </div>
    </>
  )
}

export default NoteDetail
