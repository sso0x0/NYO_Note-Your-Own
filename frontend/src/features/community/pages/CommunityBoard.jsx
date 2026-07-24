import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'

const sortOptions = [
  { value: 'createdAt', label: '최신순' },
  { value: 'likeCount', label: '좋아요' },
  { value: 'viewCount', label: '조회수' },
  { value: 'notice', label: '공지만' },
]

const POSTS_PER_PAGE = 10
const PAGES_PER_GROUP = 10
const DEFAULT_MAIN_IMAGE = '/images/nullimg.png'
const COMMUNITY_SORT_VALUES = new Set(sortOptions.map((option) => option.value))

// 기본 이미지(nullimg)는 목록 hover 미리보기 대상으로 취급하지 않는다.
const hasPreviewThumbnail = (thumbnailUrl) => {
  if (!thumbnailUrl) return false
  const imagePath = thumbnailUrl.split(/[?#]/)[0]
  return !imagePath.endsWith(DEFAULT_MAIN_IMAGE)
}

const readListStateFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  const page = Number.parseInt(params.get('page') ?? '1', 10)
  const sort = params.get('sort') ?? 'createdAt'
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    sort: COMMUNITY_SORT_VALUES.has(sort) ? sort : 'createdAt',
  }
}

function CommunityBoard({ onCreate, onOpenPost }) {
  const { auth } = useAuth()
  const [posts, setPosts] = useState([])
  const initialListState = readListStateFromUrl()
  const [sortBy, setSortBy] = useState(initialListState.sort)
  const [message, setMessage] = useState('게시글을 불러오는 중입니다.')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(initialListState.page)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [notices, setNotices] = useState([])

  const loadPosts = useCallback(async (page, sort) => {
    setLoading(true)
    setError('')
    try {
      // 커뮤니티 서버 페이지네이션: 현재 페이지와 정렬 조건만 서버에 요청합니다.
      const params = new URLSearchParams({
        page: String(page - 1),
        size: String(POSTS_PER_PAGE),
        // 공지만 보기에서는 생성일이 아니라 최종수정일을 기준으로 정렬합니다.
        sort: `${sort === 'notice' ? 'updatedAt' : sort},desc`,
        noticeOnly: String(sort === 'notice'),
      })
      const response = await fetch(`/api/posts?${params}`, {
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      })
      const data = await response.json()

      if (!response.ok) {
        const errorMessage = `게시글 목록 조회 실패: HTTP ${response.status}`
        setMessage(errorMessage)
        setError(errorMessage)
        return
      }

      setPosts(data.content ?? [])
      setNotices(data.notices ?? [])
      setTotalPages(data.totalPages ?? 0)
      setTotalElements(data.totalElements ?? 0)
      setMessage(data.totalElements > 0 ? `전체 ${data.totalElements}개의 게시글` : '등록된 게시글이 없습니다.')
    } catch (error) {
      const errorMessage = `게시글 목록 조회 실패: ${error.message}`
      setMessage(errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [auth])

  const movePage = useCallback((page, sort = sortBy) => {
    const safePage = Math.max(1, page)
    // 목록 상태를 URL에 저장해 새로고침하거나 상세 화면에서 돌아와도 같은 위치를 복원합니다.
    const params = new URLSearchParams(window.location.search)
    params.set('page', String(safePage))
    params.set('sort', sort)
    window.history.pushState(null, '', `${window.location.pathname}?${params}`)
    setCurrentPage(safePage)
    setSortBy(sort)
  }, [sortBy])

  useEffect(() => {
    // 브라우저 뒤로가기/앞으로가기 시 주소의 페이지와 정렬 조건을 목록 상태에 다시 반영합니다.
    const restoreListState = () => {
      const restored = readListStateFromUrl()
      setCurrentPage(restored.page)
      setSortBy(restored.sort)
    }
    window.addEventListener('popstate', restoreListState)
    return () => window.removeEventListener('popstate', restoreListState)
  }, [])

  useEffect(() => {
    // 최초 목록 진입 시에도 현재 상태를 URL에 표시해 새로고침 복원이 가능하게 합니다.
    const params = new URLSearchParams(window.location.search)
    params.set('page', String(currentPage))
    params.set('sort', sortBy)
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
    // URL 초기화는 컴포넌트가 처음 열릴 때 한 번만 수행합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // 페이지 또는 정렬 변경 시 해당 조건의 서버 페이지를 다시 조회합니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPosts(currentPage, sortBy)
  }, [currentPage, sortBy, loadPosts])

  const changeSort = (event) => {
    movePage(1, event.target.value)
  }

  const formatDate = (value) => {
    if (!value) return '-'
    return new Date(value).toLocaleString()
  }

  // 서버가 알려준 전체 페이지를 10개 단위로 나눠 하단 버튼이 지나치게 길어지지 않게 합니다.
  const pageGroupStart = Math.floor((currentPage - 1) / PAGES_PER_GROUP) * PAGES_PER_GROUP + 1
  const pageGroupEnd = Math.min(pageGroupStart + PAGES_PER_GROUP - 1, totalPages)
  const visiblePages = Array.from(
    { length: Math.max(0, pageGroupEnd - pageGroupStart + 1) },
    (_, index) => pageGroupStart + index,
  )

  return (
    <>
      <header className="note-header">
        <div>
          <h1>커뮤니티 게시판</h1>
          <p>DB에 저장된 커뮤니티 게시글을 자동으로 불러옵니다.</p>
        </div>
        <div className="note-header-actions">
          <button type="button" onClick={() => loadPosts(currentPage, sortBy)} disabled={loading}>새로고침</button>
          <button type="button" onClick={onCreate}>게시글 작성</button>
        </div>
      </header>

      <section className="note-list-panel">
        <div className="note-section-title">
          <p>{message}</p>
        </div>

        <label className="sort-select-label">
          정렬
          <select value={sortBy} onChange={changeSort}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {/* 목록 상태를 로딩/오류/빈 목록/정상 목록으로 분리해 명확한 안내와 재시도를 제공합니다. */}
        {loading && (
          <div className="board-state" role="status">
            <span className="board-loading-spinner" aria-hidden="true" />
            <strong>게시글을 불러오는 중입니다.</strong>
          </div>
        )}

        {!loading && error && (
          <div className="board-state board-error" role="alert">
            <strong>게시글을 불러오지 못했습니다.</strong>
            <p>{error}</p>
            <button type="button" onClick={() => loadPosts(currentPage, sortBy)}>다시 시도</button>
          </div>
        )}

        {!loading && !error && totalElements === 0 && notices.length === 0 && (
          <div className="board-state board-empty">
            <img src={DEFAULT_MAIN_IMAGE} alt="등록된 게시글 없음" />
            <strong>아직 등록된 게시글이 없습니다.</strong>
            <p>첫 번째 게시글을 작성해 보세요.</p>
            <button type="button" onClick={onCreate}>게시글 작성</button>
          </div>
        )}

        {!loading && !error && (totalElements > 0 || notices.length > 0) && <ul className="note-list">
          {/* 최신 공지 3개: 일반 게시글 10개보다 위에 별도 고정 표시합니다. */}
          {notices.map((post) => (
            <li className="note-list-item notice-list-item" key={`notice-${post.id}`}>
              <button type="button" onClick={() => onOpenPost(post.id)}>
                {/* 공지도 일반 게시글과 동일하게 제목 hover 시 실제 썸네일을 표시한다. */}
                <div className="note-title-preview-trigger">
                  <strong><span className="notice-badge">공지</span>{post.title}</strong>
                  {hasPreviewThumbnail(post.thumbnailUrl) && (
                    <img
                      className="note-main-image-preview"
                      src={post.thumbnailUrl}
                      alt={`${post.title} 메인 이미지`}
                      onError={(event) => {
                        // URL은 있지만 이미지 로딩에 실패한 경우에만 기본 이미지를 표시한다.
                        if (!event.currentTarget.src.endsWith(DEFAULT_MAIN_IMAGE)) {
                          event.currentTarget.src = DEFAULT_MAIN_IMAGE
                        }
                      }}
                    />
                  )}
                </div>
                {/* 게시판 날짜 표시: 생성일과 최종수정일을 모두 제공합니다. */}
                <span>
                  작성자 {post.authorNickname || '알 수 없는 사용자'} | 생성일 {formatDate(post.createdAt)} | 최종수정일 {formatDate(post.updatedAt)}
                </span>
              </button>
            </li>
          ))}
          {posts.map((post) => (
            <li className="note-list-item" key={post.id}>
              <button type="button" onClick={() => onOpenPost(post.id)}>
                {/* 커뮤니티 메인 이미지 미리보기: 제목 hover 시 게시글 대표 이미지를 표시합니다. */}
                <div className="note-title-preview-trigger">
                  <strong>{post.notice && <span className="notice-badge">공지</span>}{post.title}</strong>
                  {hasPreviewThumbnail(post.thumbnailUrl) && (
                    <img
                      className="note-main-image-preview"
                      src={post.thumbnailUrl}
                      alt={`${post.title} 메인 이미지`}
                      onError={(event) => {
                        // URL은 있지만 이미지 로딩에 실패한 경우에만 기본 이미지를 표시한다.
                        if (!event.currentTarget.src.endsWith(DEFAULT_MAIN_IMAGE)) {
                          event.currentTarget.src = DEFAULT_MAIN_IMAGE
                        }
                      }}
                    />
                  )}
                </div>
                <span>
                  작성자 {post.authorNickname || '알 수 없는 사용자'} | 생성일 {formatDate(post.createdAt)} | 최종수정일 {formatDate(post.updatedAt)}
                  {' | '}
                  좋아요 {post.likeCount ?? 0} | 조회수 {post.viewCount ?? 0}
                </span>
              </button>
            </li>
          ))}
        </ul>}

        {!loading && !error && totalElements > 0 && (
          // 커뮤니티 서버 페이지 선택: 현재 묶음의 페이지 번호 최대 10개와 이전/다음 버튼을 표시합니다.
          <nav className="note-pagination" aria-label="커뮤니티 페이지 선택">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => movePage(1)}
            >
              처음
            </button>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => movePage(currentPage - 1)}
            >
              이전
            </button>
            {visiblePages.map((page) => (
              <button
                type="button"
                className={page === currentPage ? 'active' : ''}
                aria-current={page === currentPage ? 'page' : undefined}
                onClick={() => movePage(page)}
                key={page}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => movePage(currentPage + 1)}
            >
              다음
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => movePage(totalPages)}
            >
              마지막
            </button>
          </nav>
        )}
      </section>
    </>
  )
}

export default CommunityBoard
