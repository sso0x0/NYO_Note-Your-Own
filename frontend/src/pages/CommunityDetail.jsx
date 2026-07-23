import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const EMPTY_HEART_IMAGE = '/images/heart.png'
const FILLED_HEART_IMAGE = '/images/hearts.png'

function CommentItem({ comment, auth, onReply, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const isOwner = auth && String(comment.userId) === String(auth.userId)
  const canDelete = !comment.isDeleted && (isOwner || auth?.role === 'ADMIN')

  const saveEdit = async () => {
    const saved = await onUpdate(comment, editContent)
    if (saved) setEditing(false)
  }

  return (
    <li className="comment-item">
      <div className="comment-body">
        {editing ? (
          <div className="comment-edit-form">
            <textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} rows="3" />
            <button type="button" onClick={saveEdit}>저장</button>
            <button type="button" onClick={() => setEditing(false)}>취소</button>
          </div>
        ) : <p>{comment.content}</p>}
        {/* 댓글 nickname 표시: 댓글과 재귀 렌더링되는 대댓글 모두 작성자 nickname을 사용합니다. */}
        <span>작성자 {comment.authorNickname || '알 수 없는 사용자'}</span>
        {!comment.isDeleted && <button type="button" onClick={() => onReply(comment)}>답글</button>}
        {/* 수정은 작성자만, 삭제는 작성자 또는 DB ROLE이 ADMIN인 사용자에게만 표시합니다. */}
        {!comment.isDeleted && isOwner && !editing && <button type="button" onClick={() => setEditing(true)}>수정</button>}
        {canDelete && <button type="button" className="danger-button" onClick={() => onDelete(comment)}>삭제</button>}
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

function CommunityDetail({ postId, onBack, onEdit }) {
  const { auth } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentForm, setCommentForm] = useState({
    content: '',
    parentCommentId: null,
  })
  const [message, setMessage] = useState('게시글을 불러오는 중입니다.')
  const [loading, setLoading] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  const loadPost = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}`)
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

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/comments/posts/${postId}`)
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

  const loadLikeStatus = async () => {
    const response = await fetch(`/api/posts/${postId}/like`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    })
    if (response.ok) setLiked(await response.json())
  }

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

  const handleCommentChange = (event) => {
    const { name, value } = event.target
    setCommentForm((prev) => ({ ...prev, [name]: value }))
  }

  // 삭제 버튼은 작성자 본인 또는 로그인 정보의 DB 역할이 ADMIN인 경우에만 표시합니다.
  const canDelete = post && auth && (
    String(post.userId) === String(auth.userId) || auth.role === 'ADMIN'
  )
  // 수정은 관리자 권한과 관계없이 게시글을 작성한 로그인 사용자 본인에게만 허용합니다.
  const canEdit = post && auth && String(post.userId) === String(auth.userId)

  const selectReplyTarget = (comment) => {
    setCommentForm((prev) => ({
      ...prev,
      parentCommentId: comment.id,
      content: '',
    }))
  }

  const cancelReply = () => {
    setCommentForm((prev) => ({ ...prev, parentCommentId: null }))
  }

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
      await loadComments()
    } catch (error) {
      setMessage(`댓글 저장 실패: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

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

  const formatDate = (value) => {
    if (!value) return '-'
    return new Date(value).toLocaleString('ko-KR')
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
    <>
      <article className="note-detail-panel">
        <div className="note-header-actions post-detail-actions">
          {canEdit && <button type="button" onClick={() => onEdit(post.id)}>수정</button>}
          {canDelete && <button type="button" className="danger-button" onClick={deletePost} disabled={loading}>삭제</button>}
          <button type="button" onClick={onBack}>목록</button>
        </div>

        {post ? (
          <>
            {/* 실제 게시글 제목을 상세 화면의 주제목으로 표시하고 작성자·최종수정일만 바로 아래에 둡니다. */}
            <h1 className="post-detail-title">{post.title}</h1>
            <p className="post-detail-byline">
              <strong>{post.authorNickname || '알 수 없는 사용자'}</strong>
              <span aria-hidden="true"> | </span>
              <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
              <span aria-hidden="true"> | </span>
              <span>조회수 {post.viewCount ?? 0}</span>
            </p>

            {post.thumbnailUrl && (
              <img className="note-thumbnail" src={post.thumbnailUrl} alt="게시글 이미지" />
            )}

            <div className="note-content">{renderPostContent(post.content)}</div>

            {/* 하트 아이콘 옆에 서버의 현재 총 좋아요 수를 함께 표시합니다. */}
            <div className="note-header-actions post-like-summary">
              <button
                type="button"
                className="like-icon-button"
                onClick={toggleLike}
                disabled={likeLoading}
                aria-label={liked ? '좋아요 취소' : '좋아요'}
                aria-pressed={liked}
              >
                <img src={liked ? FILLED_HEART_IMAGE : EMPTY_HEART_IMAGE} alt="" />
              </button>
              <span>{post.likeCount ?? 0}</span>
            </div>
          </>
        ) : (
          <p>{loading ? '불러오는 중입니다.' : message}</p>
        )}
      </article>

      <section className="comment-panel">
        <h2>댓글</h2>
        <form className="comment-form" onSubmit={createComment}>
          {commentForm.parentCommentId && (
            <div className="reply-target">
              {/* 부모 댓글 번호는 노출하지 않고 답글 작성 상태만 간단히 안내합니다. */}
              답글 작성 중
              <button type="button" onClick={cancelReply}>취소</button>
            </div>
          )}
          <textarea name="content" rows="4" value={commentForm.content} onChange={handleCommentChange} placeholder="댓글 내용" />
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
    </>
  )
}

export default CommunityDetail
