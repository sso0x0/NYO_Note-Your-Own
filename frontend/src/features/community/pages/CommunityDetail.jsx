import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import ReportButton from '../../report/components/ReportButton'
import './CommunityDetail.css'

const EMPTY_HEART_IMAGE = '/images/heart.png'
const FILLED_HEART_IMAGE = '/images/hearts.png'

// 댓글 입력창은 드래그로 늘리지 못하게 하고, 입력 중에만 내용에 맞춰 높이를 키운다.
function autoGrowTextarea(el) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

// 날짜 값을 한국어 로케일의 날짜/시간 문자열로 변환한다.
function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('ko-KR')
}

// 댓글 프로필 아바타 색상 팔레트. 매번 렌더링할 때마다 바뀌면 산만하므로
// 작성자(userId) 기준으로 고정된 색을 골라서 같은 사람은 항상 같은 색이 나오게 한다.
const AVATAR_PALETTE = [
  { bg: '#fdeef2', fg: '#e57391' },
  { bg: '#eef4fd', fg: '#4f83cc' },
  { bg: '#eafbf0', fg: '#2f9e58' },
  { bg: '#fff6e0', fg: '#c98a1f' },
  { bg: '#f3edfd', fg: '#8a5cf6' },
  { bg: '#fdece8', fg: '#e0553f' },
  { bg: '#e8fbfa', fg: '#1fa79a' },
  { bg: '#fdf0f7', fg: '#d1499a' },
]

// 댓글 작성자를 기준으로 팔레트에서 고정된 아바타 색상을 골라 반환한다.
function avatarColorFor(comment) {
  const seed = String(comment.userId ?? comment.authorNickname ?? comment.id ?? '')
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  const { bg, fg } = AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
  return { backgroundColor: bg, color: fg }
}

// 댓글 개수는 최상위 댓글뿐 아니라 중첩된 대댓글까지 모두 포함해서 센다.
// 답글을 위해 자리표시자로 남아있는 삭제된 댓글은 세지 않는다.
function countComments(comments) {
  return comments.reduce(
    (total, comment) =>
      total + (comment.isDeleted ? 0 : 1) + (comment.replies?.length ? countComments(comment.replies) : 0),
    0,
  )
}

// 댓글 한 건을 렌더링하고, 대댓글은 자기 자신을 재귀 호출해 트리 형태로 그린다.
function CommentItem({ comment, auth, onReply, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const isOwner = auth && String(comment.userId) === String(auth.userId)
  const canDelete = !comment.isDeleted && (isOwner || auth?.role === 'ADMIN')
  const isEdited = !comment.isDeleted && comment.createdAt && comment.updatedAt && comment.createdAt !== comment.updatedAt
  const isWithdrawnAuthor = comment.authorNickname === '탈퇴한 사용자'

  // 수정한 댓글 내용을 저장하고 성공하면 수정 모드를 종료한다.
  const saveEdit = async () => {
    const saved = await onUpdate(comment, editContent)
    if (saved) setEditing(false)
  }

  return (
      <li className={`comment-item${comment.isDeleted ? ' comment-item--deleted' : ''}${isWithdrawnAuthor ? ' comment-item--withdrawn' : ''}`}>
        <div
            className="comment-item__avatar"
            aria-hidden="true"
            style={comment.isDeleted || isWithdrawnAuthor ? undefined : avatarColorFor(comment)}
        >
          {(comment.authorNickname || '?').charAt(0)}
        </div>
        <div className="comment-body">
          <div className="comment-body__main">
            {/* 댓글 nickname 표시: 댓글과 재귀 렌더링되는 대댓글 모두 작성자 nickname을 사용합니다. */}
            <div className="comment-body__header">
              <span className="comment-body__author">{comment.authorNickname || '알 수 없는 사용자'}</span>
              {!comment.isDeleted && (
                  <time className="comment-body__date" dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
              )}
              {isEdited && <span className="comment-body__edited">(수정됨)</span>}
            </div>
            {editing ? (
                <div className="comment-edit-form">
              <textarea
                  ref={autoGrowTextarea}
                  value={editContent}
                  onChange={(event) => setEditContent(event.target.value)}
                  onInput={(event) => autoGrowTextarea(event.target)}
                  rows="1"
              />
                  <button type="button" onClick={saveEdit}>저장</button>
                  <button type="button" onClick={() => setEditing(false)}>취소</button>
                </div>
            ) : <p className={comment.isDeleted ? 'comment-body__deleted-text' : undefined}>{comment.content}</p>}
          </div>
          <div className="comment-body__actions">
            {!comment.isDeleted && <button type="button" onClick={() => onReply(comment)}>답글</button>}
            {/* 삭제되지 않은 댓글과 답글은 같은 COMMENT 타입으로 신고한다. */}
            {!comment.isDeleted && !isOwner && (
              <ReportButton targetType="COMMENT" targetId={comment.id} className="comment-report-button" />
            )}
            {/* 수정은 작성자만, 삭제는 작성자 또는 DB ROLE이 ADMIN인 사용자에게만 표시합니다. */}
            {!comment.isDeleted && isOwner && !editing && <button type="button" onClick={() => setEditing(true)}>수정</button>}
            {canDelete && <button type="button" className="danger-button" onClick={() => onDelete(comment)}>삭제</button>}
          </div>
        </div>

        {comment.replies?.length > 0 && (
            <ul className="comment-replies">
              {comment.replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} auth={auth} onReply={onReply} onUpdate={onUpdate} onDelete={onDelete} />
              ))}
            </ul>
        )}
      </li>
  )
}

// 게시글 상세: 본문/좋아요/신고와 댓글(대댓글 포함) CRUD를 함께 다룬다.
function CommunityDetail({ postId, onBack, onEdit }) {
  const { auth } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentForm, setCommentForm] = useState({
    content: '',
    parentCommentId: null,
  })
  const commentTextareaRef = useRef(null)
  const [message, setMessage] = useState('게시글을 불러오는 중입니다.')
  const [loading, setLoading] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  // 게시글 상세 정보를 서버에서 조회해 상태에 저장한다.
  const loadPost = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(`게시글 상세 조회 실패: HTTP ${response.status}`)
        return
      }

      setPost(data)
      setMessage('')
    } catch (error) {
      setMessage(`게시글 상세 조회 실패: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 게시글에 달린 댓글(대댓글 포함) 목록을 조회해 상태에 저장한다.
  const loadComments = async () => {
    try {
      const response = await fetch(`/api/comments/posts/${postId}`, {
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(`댓글 조회 실패: HTTP ${response.status}`)
        return
      }

      setComments(data)
    } catch (error) {
      setMessage(`댓글 조회 실패: ${error.message}`)
    }
  }

  // 현재 사용자가 이 게시글에 좋아요를 눌렀는지 조회한다.
  const loadLikeStatus = async () => {
    const response = await fetch(`/api/posts/${postId}/like`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    })
    if (response.ok) setLiked(await response.json())
  }

  // 게시글 진입 시 조회수를 올리고, 본문/댓글/좋아요 상태를 함께 불러온다.
  useEffect(() => {
    const increaseViewCount = async () => {
      // 상세 페이지에 들어오면 common.view_logs로 하루 1회만 조회수를 올린다.
      // 서버는 쿼리 파라미터가 아니라 JWT로 조회자를 판별한다.
      if (!auth?.accessToken) return

      const response = await fetch(`/api/posts/${postId}/view`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      })

      if (!response.ok) throw new Error(`조회수 증가 실패: HTTP ${response.status}`)
    }

    const load = async () => {
      // 조회수나 좋아요 상태 요청 하나가 실패해도 게시글 본문·댓글 조회까지 중단되지 않게 독립 실행합니다.
      // 조회수 증가 후 본문을 읽어야 갱신된 숫자가 화면에 바로 표시된다.
      // 증가가 실패하더라도 공개된 게시글 본문 조회는 계속 진행한다.
      await increaseViewCount().catch(() => null)
      await Promise.allSettled([
        loadPost(),
        loadComments(),
        loadLikeStatus(),
      ])
    }

    load()
  }, [postId, auth?.accessToken])

  const toggleLike = async () => {
    if (likeLoading) return
    setLikeLoading(true)
    try {
      // 현재 상태에 따라 한 버튼이 좋아요 등록(POST)과 취소(DELETE)를 번갈아 수행합니다.
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: liked ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      })
      if (!response.ok) {
        setMessage(`좋아요 처리 실패: HTTP ${response.status}`)
        return
      }
      setLiked((previous) => !previous)
      await loadPost()
    } finally {
      setLikeLoading(false)
    }
  }

  // 확인 후 게시글을 삭제하고 목록으로 돌아간다.
  const deletePost = async () => {
    if (!window.confirm('게시글을 삭제할까요?')) {
      return
    }

    setLoading(true)
    try {
      // 게시글 삭제 API를 호출하면 백엔드에서 연결된 GCS 이미지도 같이 삭제한다.
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      })

      if (!response.ok) {
        setMessage(`게시글 삭제 실패: HTTP ${response.status}`)
        return
      }

      onBack()
    } catch (error) {
      setMessage(`게시글 삭제 실패: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 댓글 입력창의 값 변경을 댓글 작성 폼 상태에 반영한다.
  const handleCommentChange = (event) => {
    const { name, value } = event.target
    setCommentForm((prev) => ({ ...prev, [name]: value }))
  }

  // Shift+Enter는 줄바꿈, Enter만 누르면 댓글이 바로 등록되게 한다.
  // 한글 등 조합 입력 중 Enter로 글자를 완성하는 경우(isComposing)에는 등록되지 않게 막는다.
  const handleCommentKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  // 삭제 버튼은 작성자 본인 또는 로그인 정보의 DB 역할이 ADMIN인 경우에만 표시합니다.
  const canDelete = post && auth && (
      String(post.userId) === String(auth.userId) || auth.role === 'ADMIN'
  )
  // 수정은 관리자 권한과 관계없이 게시글을 작성한 로그인 사용자 본인에게만 허용합니다.
  const canEdit = post && auth && String(post.userId) === String(auth.userId)

  // 답글 대상 댓글을 지정하고 입력창을 답글 작성 상태로 초기화한다.
  const selectReplyTarget = (comment) => {
    setCommentForm((prev) => ({
      ...prev,
      parentCommentId: comment.id,
      content: '',
    }))
    if (commentTextareaRef.current) commentTextareaRef.current.style.height = 'auto'
  }

  // 답글 작성 상태를 취소하고 일반 댓글 입력 상태로 되돌린다.
  const cancelReply = () => {
    setCommentForm((prev) => ({ ...prev, parentCommentId: null }))
  }

  // 입력한 댓글(또는 답글)을 서버에 등록하고 댓글 목록을 새로고침한다.
  const createComment = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        // 댓글 작성자는 입력값이 아니라 JWT에서 확인한 현재 로그인 사용자로 고정합니다.
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({
          postId: Number(postId),
          parentCommentId: commentForm.parentCommentId,
          content: commentForm.content,
        }),
      })

      if (!response.ok) {
        setMessage(`댓글 저장 실패: HTTP ${response.status}`)
        return
      }

      setCommentForm((prev) => ({ ...prev, content: '', parentCommentId: null }))
      if (commentTextareaRef.current) commentTextareaRef.current.style.height = 'auto'
      await loadComments()
    } catch (error) {
      setMessage(`댓글 저장 실패: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 댓글 내용을 수정하고 성공 시 댓글 목록을 새로고침한다.
  const updateComment = async (comment, content) => {
    if (!content.trim()) {
      setMessage('댓글 내용을 입력해 주세요.')
      return false
    }
    const response = await fetch(`/api/comments/${comment.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify({
        postId: Number(postId),
        parentCommentId: comment.parentCommentId,
        content,
      }),
    })
    if (!response.ok) {
      setMessage(`댓글 수정 실패: HTTP ${response.status}`)
      return false
    }
    await loadComments()
    return true
  }

  // 확인 후 댓글을 삭제하고 댓글 목록을 새로고침한다.
  const deleteComment = async (comment) => {
    if (!window.confirm('댓글을 삭제할까요?')) return
    const response = await fetch(`/api/comments/${comment.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    })
    if (!response.ok) {
      setMessage(`댓글 삭제 실패: HTTP ${response.status}`)
      return
    }
    await loadComments()
  }

  const renderPostContent = (content) => {
    // 저장된 게시글 본문에서 코드블럭과 본문 이미지를 분리해서 보여준다.
    return content.split('```').map((part, index) => {
      if (index % 2 === 1) {
        return (
            <pre className="note-code-block" key={index}>
            <code>{part.trim()}</code>
          </pre>
        )
      }

      return renderTextWithImages(part, `post-text-${index}`)
    })
  }

  // 텍스트에서 마크다운 이미지 문법을 찾아 이미지와 텍스트 블록으로 분리해 렌더링한다.
  const renderTextWithImages = (text, keyPrefix) => {
    const imagePattern = /!\[[^\]]*]\((https?:\/\/[^)]+)\)(?:\{width=(\d+)\})?/g
    const blocks = []
    let lastIndex = 0
    let match

    while ((match = imagePattern.exec(text)) !== null) {
      const textBeforeImage = text.slice(lastIndex, match.index)
      if (textBeforeImage) {
        blocks.push(<p className="note-text-block" key={`${keyPrefix}-text-${blocks.length}`}>{textBeforeImage}</p>)
      }

      blocks.push(
          <img
              className="content-inline-image"
              src={match[1]}
              style={match[2] ? { width: `${match[2]}px` } : undefined}
              alt="본문 이미지"
              key={`${keyPrefix}-image-${blocks.length}`}
          />
      )
      lastIndex = match.index + match[0].length
    }

    const restText = text.slice(lastIndex)
    if (restText) {
      blocks.push(<p className="note-text-block" key={`${keyPrefix}-text-rest`}>{restText}</p>)
    }

    return blocks
  }

  return (
      <div className="post-detail-page">
        <div className="post-detail-page__toolbar">
          <button type="button" className="post-detail-page__back" onClick={onBack}>← 목록</button>
          <div className="post-detail-page__actions">
            {canEdit && <button type="button" onClick={() => onEdit(post.id)}>수정</button>}
            {canDelete && <button type="button" className="danger-button" onClick={deletePost} disabled={loading}>삭제</button>}
          </div>
        </div>

        <article className="post-detail-page__article">
          {post ? (
              <>
                {/* 실제 게시글 제목을 상세 화면의 주제목으로 표시하고 작성자·최종수정일만 바로 아래에 둡니다. */}
                <h1 className="post-detail-page__title">{post.title}</h1>
                <p className="post-detail-page__meta">
                  <span className="post-detail-page__author">{post.authorNickname || '알 수 없는 사용자'}</span>
                  <span className="post-detail-page__dot" aria-hidden="true">·</span>
                  <time dateTime={post.updatedAt}>최종수정일 {formatDate(post.updatedAt)}</time>
                  <span className="post-detail-page__dot" aria-hidden="true">·</span>
                  <span>조회수 {post.viewCount ?? 0}</span>
                </p>

                <div className="post-detail-page__content">{renderPostContent(post.content)}</div>

                {/* 하트 아이콘과 서버의 현재 총 좋아요 수를 하나의 버튼으로 묶어 보여줍니다. */}
                <div className="post-detail-page__like-row">
                  <button
                      type="button"
                      className={`post-detail-page__like-btn${liked ? ' is-liked' : ''}`}
                      onClick={toggleLike}
                      disabled={likeLoading}
                      aria-label={liked ? '좋아요 취소' : '좋아요'}
                      aria-pressed={liked}
                  >
                    <img src={liked ? FILLED_HEART_IMAGE : EMPTY_HEART_IMAGE} alt="" />
                    <span>{post.likeCount ?? 0}</span>
                  </button>
                  {/* 좋아요와 같은 줄에서 신고 버튼만 오른쪽 끝에 배치한다. */}
                  {/* 본인이 작성한 게시글에는 신고 버튼을 표시하지 않는다. */}
                  {!canEdit && !post.notice && (
                    <ReportButton targetType="POST" targetId={post.id} className="community-report-button" />
                  )}
                </div>
              </>
          ) : (
              <p className="post-detail-page__status">{loading ? '불러오는 중입니다.' : message}</p>
          )}
        </article>

        <section className="post-detail-page__comments">
          <h2>댓글 <span className="post-detail-page__comment-count">{countComments(comments)}</span></h2>
          <form className="comment-form" onSubmit={createComment}>
            {commentForm.parentCommentId && (
                <div className="reply-target">
                  {/* 부모 댓글 번호는 노출하지 않고 답글 작성 상태만 간단히 안내합니다. */}
                  답글 작성 중
                  <button type="button" onClick={cancelReply}>취소</button>
                </div>
            )}
            <textarea
                ref={commentTextareaRef}
                name="content"
                rows="1"
                value={commentForm.content}
                onChange={handleCommentChange}
                onInput={(event) => autoGrowTextarea(event.target)}
                onKeyDown={handleCommentKeyDown}
                placeholder="댓글 내용"
            />
            <button type="submit" disabled={loading}>댓글 등록</button>
          </form>

          <ul className="comment-list">
            {comments.map((comment) => (
                <CommentItem
                    key={comment.id}
                    comment={comment}
                    auth={auth}
                    onReply={selectReplyTarget}
                    onUpdate={updateComment}
                    onDelete={deleteComment}
                />
            ))}
          </ul>
        </section>
      </div>
  )
}

export default CommunityDetail
