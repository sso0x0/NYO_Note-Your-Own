import { useEffect, useRef, useState } from 'react'
import { parseTextColors } from '../../../utils/textColor'
import { useAuth } from '../../../context/AuthContext'
import { parseMainImage } from '../../../utils/mainImage'
import ReportButton from '../../report/components/ReportButton'
import { generateAiTags, getNoteTags } from '../api/tag'
import { sendMessage } from '../../chat/api/chat'
import ChatMessage from '../../chat/ChatMessage'
import ChatInput from '../../chat/ChatInput'
import '../../chat/chat.css'
import './NoteDetailDesign.css'

const EMPTY_HEART_IMAGE = '/images/heart.png'
const FILLED_HEART_IMAGE = '/images/hearts.png'
const QUESTION_LIST_PREVIEW_COUNT = 4

// 질문 목록 아이콘. 강의 시청 페이지의 학습용 챗봇과 톤을 맞춘 단색 아웃라인 SVG.
function QuestionListIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="4.5" cy="6" r="0.8" fill="currentColor" />
            <circle cx="4.5" cy="12" r="0.8" fill="currentColor" />
            <circle cx="4.5" cy="18" r="0.8" fill="currentColor" />
            <path d="M8.5 6h11M8.5 12h11M8.5 18h11" />
        </svg>
    )
}

// key={noteId}로 노트가 바뀔 때마다 이 컴포넌트를 통째로 새로 마운트해서
// 대화 기록은 서버(chat_histories)에 계속 쌓이지만, 화면에는 다른 노트의 대화가 이어서 보이지 않는다.
// 강의 시청 페이지의 학습용 챗봇과 동일하게 접기/펼치기 + 질문 목록 팝오버를 제공한다.
function NoteDetailChat({ lectureId, noteId }) {
    const [chatMessages, setChatMessages] = useState([])
    const [chatSending, setChatSending] = useState(false)
    const [chatError, setChatError] = useState(null)
    const chatBottomRef = useRef(null)

    const [chatDrawerOpen, setChatDrawerOpen] = useState(true)
    const [showQuestionList, setShowQuestionList] = useState(false)
    const [questionListExpanded, setQuestionListExpanded] = useState(false)

    // 대화는 서버(chat_histories)에 계속 저장되지만, 노트를 나갔다 들어오거나 다른 강의로
    // 이동하면 화면에는 이전 대화를 다시 불러오지 않고 빈 상태로 시작한다.
    useEffect(() => {
        setChatMessages([])
        setChatError(null)
        setShowQuestionList(false)
        setQuestionListExpanded(false)
    }, [lectureId])

    // 서버에서 지난 질문을 다시 불러오지 않고, 위 chatMessages에서 사용자 질문만 걸러서 보여준다
    // (마이페이지 챗봇 기록과는 별개).
    const askedQuestions = chatMessages.filter((message) => message.senderRole === 'USER')

    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages])

    // 질문 목록에서 항목을 누르면 대화창에서 그 질문이 있는 위치로 스크롤해서 보여주고, 팝오버는 닫는다.
    const scrollToQuestion = (questionId) => {
        setShowQuestionList(false)
        document.getElementById(`note-chat-message-${questionId}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    const handleChatSend = async (message) => {
        setChatError(null)
        setChatSending(true)
        setChatMessages((previous) => [
            ...previous,
            { id: `pending-${Date.now()}`, senderRole: 'USER', message },
        ])

        try {
            // 연결된 강의 ID로 저장해 노트와 강의 화면에서 같은 대화를 이어가고,
            // 지금 보고 있는 노트 ID도 같이 보내 "이 노트 설명해줘" 같은 질문도 이 노트를 근거로 답하게 한다.
            const answer = await sendMessage({ lectureId, noteId, message })
            setChatMessages((previous) => [...previous, answer])
        } catch (error) {
            setChatError(error.message)
        } finally {
            setChatSending(false)
        }
    }

    return (
        <aside className={`note-detail-chat${chatDrawerOpen ? '' : ' is-collapsed'}`}>
            {chatDrawerOpen ? (
                <>
                    <div className="note-detail-chat__header">
                        <span className="note-detail-chat__badge">AI</span>
                        <span className="note-detail-chat__title">학습용 챗봇</span>
                        <button
                            type="button"
                            className="note-detail-chat__question-list-toggle"
                            onClick={() => setShowQuestionList((v) => !v)}
                            aria-label={showQuestionList ? '질문 목록 닫기' : '질문 목록 보기'}
                        >
                            <QuestionListIcon />
                        </button>
                        <button
                            type="button"
                            className="note-detail-chat__collapse"
                            onClick={() => setChatDrawerOpen(false)}
                        >
                            접기 ›
                        </button>
                        {showQuestionList && (
                            <div className="note-detail-chat__question-list-popover">
                                <ul className="note-detail-chat__history-list">
                                    {askedQuestions.length === 0 && (
                                        <li className="note-detail-chat__history-empty">아직 물어본 질문이 없습니다.</li>
                                    )}
                                    {(questionListExpanded ? askedQuestions : askedQuestions.slice(0, QUESTION_LIST_PREVIEW_COUNT)).map((question) => (
                                        <li key={question.id}>
                                            <button
                                                type="button"
                                                className="note-detail-chat__history-item"
                                                onClick={() => scrollToQuestion(question.id)}
                                            >
                                                {question.createdAt && (
                                                    <span className="note-detail-chat__history-date">
                                {question.createdAt.replace('T', ' ').slice(0, 16)}
                              </span>
                                                )}
                                                <span className="note-detail-chat__history-text">{question.message}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                {askedQuestions.length > QUESTION_LIST_PREVIEW_COUNT && (
                                    <button
                                        type="button"
                                        className="note-detail-chat__history-more"
                                        onClick={() => setQuestionListExpanded((v) => !v)}
                                    >
                                        {questionListExpanded ? '접기' : `더보기 (${askedQuestions.length - QUESTION_LIST_PREVIEW_COUNT})`}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="chat-messages">
                        {chatMessages.map((chatMessage) => (
                            <div key={chatMessage.id} id={`note-chat-message-${chatMessage.id}`}>
                                <ChatMessage
                                    senderRole={chatMessage.senderRole}
                                    message={chatMessage.message}
                                />
                            </div>
                        ))}
                        <div ref={chatBottomRef} />
                    </div>
                    {chatError && <p className="chat-error">{chatError}</p>}
                    <ChatInput sending={chatSending} onSend={handleChatSend} />
                </>
            ) : (
                <button
                    type="button"
                    className="note-detail-chat__expand"
                    onClick={() => setChatDrawerOpen(true)}
                >
                    ‹ AI 챗봇
                </button>
            )}
        </aside>
    )
}

function NoteDetail({ noteId, onBack, onEdit, onTagClick }) {
    const { auth } = useAuth()
    const notePrintRef = useRef(null)
    const [note, setNote] = useState(null)
    const [message, setMessage] = useState('노트를 불러오는 중입니다.')
    const [loading, setLoading] = useState(false)
    const [liked, setLiked] = useState(false)
    const [likeLoading, setLikeLoading] = useState(false)
    const [tags, setTags] = useState([])
    const [tagGenerating, setTagGenerating] = useState(false)
    const [tagError, setTagError] = useState(null)
    const userId = auth?.userId

    const loadTags = async () => {
        try {
            const response = await getNoteTags(noteId)
            setTags(response ?? [])
        } catch (error) {
            setTagError(error.message)
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

    const exportNotePdf = async () => {
        const printableNote = notePrintRef.current
        if (!note || !printableNote) {
            return
        }

        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            setMessage('PDF 창을 열 수 없습니다. 브라우저 팝업 차단을 확인하세요.')
            return
        }

        // 현재 렌더링된 상세 영역을 복제해 글자색·서식·이미지 위치를 화면과 동일하게 출력합니다.
        const styleNodes = [...document.querySelectorAll('link[rel="stylesheet"], style')]
            .map((node) => node.outerHTML)
            .join('')
        const titleHtml = printableNote.querySelector('.post-detail-title')?.outerHTML
            ?? `<h1 class="post-detail-title">${escapeHtml(note.title)}</h1>`
        const contentHtml = printableNote.querySelector('.note-content')?.outerHTML
            ?? '<div class="note-content"></div>'
        printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <base href="${window.location.origin}/" />
          <title>${escapeHtml(note.title)}</title>
          ${styleNodes}
          <style>
            body { max-width: 1000px; margin: 32px auto; padding: 0 24px; background: #fff; }
            .note-detail-panel { box-shadow: none; }
            button { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body>
          <article class="note-detail-panel">
            ${titleHtml}
            ${contentHtml}
          </article>
        </body>
      </html>
    `)
        printWindow.document.close()

        // 새 출력 창의 이미지가 모두 준비된 뒤 인쇄를 열어 PDF에서 이미지가 빠지지 않게 합니다.
        await Promise.all([...printWindow.document.images].map((image) => (
            image.complete
                ? Promise.resolve()
                : new Promise((resolve) => {
                    image.addEventListener('load', resolve, { once: true })
                    image.addEventListener('error', resolve, { once: true })
                })
        )))
        printWindow.focus()
        printWindow.print()
    }

    const exportNoteMarkdown = () => {
        if (!note) return

        // 노트 제목과 저장된 본문 문법을 UTF-8 마크다운 파일로 다운로드합니다.
        const markdown = `# ${note.title}\n\n${note.content}\n`
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
        const downloadUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const safeTitle = note.title.replace(/[\\/:*?"<>|]/g, '_').trim() || `note-${note.id}`
        link.href = downloadUrl
        link.download = `${safeTitle}.md`
        document.body.append(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(downloadUrl)
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
    const mainImageAlreadyInContent = mainImage.url
        ? [...String(note?.content ?? '').matchAll(/!\[[^\]]*]\((https?:\/\/[^)]+)\)/g)]
            .some((match) => match[1] === mainImage.url)
        : false

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
                return `<pre><code>${createPrintableColoredText(part.trim())}</code></pre>`
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
        .map((part) => {
            const styles = [
                part.color ? `color: ${part.color}` : '',
                part.bold ? 'font-weight: 700' : '',
                part.italic ? 'font-style: italic' : '',
                part.underline ? 'text-decoration: underline' : '',
            ].filter(Boolean).join('; ')
            return styles ? `<span style="${styles}">${escapeHtml(part.text)}</span>` : escapeHtml(part.text)
        })
        .join('')

    const renderNoteContent = (content) => {
        // 저장된 본문에서 ```로 감싼 부분은 코드블럭으로 분리해서 보여준다.
        return content.split('```').map((part, index) => {
            if (index % 2 === 1) {
                return (
                    <pre className="note-code-block" key={index}>
            {/* 코드블록 안에서도 저장된 글자색·볼드·밑줄 문법을 실제 서식으로 표시합니다. */}
                        <code>{renderColoredText(part.trim(), `note-code-${index}`)}</code>
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
            <span
                style={{
                    color: part.color || undefined,
                    fontWeight: part.bold ? 700 : undefined,
                    fontStyle: part.italic ? 'italic' : undefined,
                    textDecoration: part.underline ? 'underline' : undefined,
                }}
                key={`${keyPrefix}-${index}`}
            >
            {part.text}
          </span>
        ))
    )

    return (
        <section className="note-detail-page">
            <nav className="note-detail-page__crumbs" aria-label="현재 위치">
                <button type="button" onClick={onBack}>노트 목록</button>
                <span>/</span>
                <span className="is-current">{note?.title || '노트 상세'}</span>
            </nav>

            <header className="note-header note-detail-page__toolbar">
                <div className="note-detail-page__toolbar-main">
                    <button type="button" className="note-detail-page__list-button" onClick={onBack}>목록</button>
                    <div className="note-header-actions">
                        {/* 노트 파일 저장 기능은 작성자 본인에게만 표시한다. */}
                        {canEdit && <button type="button" onClick={exportNotePdf}>PDF 저장</button>}
                        {canEdit && <button type="button" onClick={exportNoteMarkdown}>마크다운 저장</button>}
                        {canEdit && <button type="button" onClick={() => onEdit(note)}>수정</button>}
                        {canDelete && <button type="button" className="danger-button" onClick={deleteNote} disabled={loading}>삭제</button>}
                    </div>
                </div>
            </header>

            <div className="note-detail-layout">
                <article ref={notePrintRef} className="note-detail-panel">
                    {note ? (
                        <>
                            {/* 게시판 상세처럼 제목 아래에 작성자·강의·수정일·조회수를 한 줄로 표시한다. */}
                            <h1 className="post-detail-title">{note.title}</h1>
                            <p className="post-detail-byline note-detail-byline">
                    <span className="note-detail-byline__left">
                      <strong>{note.authorNickname || '알 수 없는 사용자'}</strong>
                      <span aria-hidden="true"> | </span>
                      <span>{note.lectureTitle || '강의 정보 없음'}</span>
                    </span>
                                <span className="note-detail-byline__right">
                      <time dateTime={note.createdAt}>작성일 {formatDate(note.createdAt)}</time>
                      <span aria-hidden="true"> | </span>
                      <time dateTime={note.updatedAt}>수정일 {formatDate(note.updatedAt)}</time>
                      <span aria-hidden="true"> | </span>
                      <span>조회수 {note.viewCount ?? 0}</span>
                    </span>
                            </p>

                            <div className="note-tags">
                                {tags.map((tag) => (
                                    <button
                                        key={tag.tagId}
                                        type="button"
                                        className="note-tag-chip"
                                        onClick={() => onTagClick?.(tag.tagName)}
                                        title={`'${tag.tagName}' 태그가 붙은 다른 노트 보기`}
                                    >
                                        {tag.isAiGenerated && <span className="note-tag-chip__ai">AI</span>}
                                        {tag.tagName}
                                    </button>
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
                                    <dt>수정일</dt>
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
                            {mainImage.url && !mainImageAlreadyInContent && (
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
                                {/* 노트 ID를 신고 대상으로 전달하고, 신고 사유 입력은 공통 신고 창에서 처리한다. */}
                                {/* 본인이 작성한 노트는 자신을 신고할 수 없으므로 신고 버튼을 숨긴다. */}
                                {!canEdit && (
                                  <ReportButton targetType="NOTE" targetId={note.id} className="note-report-button" />
                                )}
                            </div>
                        </>
                    ) : (
                        <p>{loading ? '불러오는 중입니다.' : message}</p>
                    )}
                </article>
                {note?.lectureId && <NoteDetailChat key={noteId} lectureId={note.lectureId} noteId={noteId} />}
            </div>
        </section>
    )
}

export default NoteDetail
