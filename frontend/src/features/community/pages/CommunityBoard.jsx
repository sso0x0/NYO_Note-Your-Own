import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import BoardSearchBar from '../../../components/BoardSearchBar'
import '../components/PostCard.css'
import './CommunityBoard.css'

const sortOptions = [
    { value: 'createdAt', label: '최신순' },
    { value: 'likeCount', label: '인기순' },
    { value: 'viewCount', label: '조회수순' },
    { value: 'notice', label: '공지' },
]

const POSTS_PER_PAGE = 10
const PAGE_WINDOW = 5
const DEFAULT_MAIN_IMAGE = '/images/nullimg.png'
const COMMUNITY_SORT_VALUES = new Set(sortOptions.map((option) => option.value))

const readListStateFromUrl = () => {
    const params = new URLSearchParams(window.location.search)
    const page = Number.parseInt(params.get('page') ?? '1', 10)
    const sort = params.get('sort') ?? 'createdAt'
    return {
        page: Number.isInteger(page) && page > 0 ? page : 1,
        sort: COMMUNITY_SORT_VALUES.has(sort) ? sort : 'createdAt',
    }
}

// 현재 페이지를 중심으로 최대 5개의 페이지 번호만 보여준다 (이전 / 1 2 3 4 5 / 다음 형태).
function getPageNumbers(current, totalPages) {
    if (totalPages <= PAGE_WINDOW) {
        return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    let start = Math.max(1, current - Math.floor(PAGE_WINDOW / 2))
    let end = start + PAGE_WINDOW - 1
    if (end > totalPages) {
        end = totalPages
        start = end - PAGE_WINDOW + 1
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function formatShortDate(value) {
    return value ? value.slice(0, 10) : '-'
}

function CommunityBoard({ onCreate, onOpenPost }) {
    const { auth } = useAuth()
    const [posts, setPosts] = useState([])
    const initialListState = readListStateFromUrl()
    const [sortBy, setSortBy] = useState(initialListState.sort)
    const [isSortOpen, setIsSortOpen] = useState(false)
    const sortRef = useRef(null)
    const [message, setMessage] = useState('게시글을 불러오는 중입니다.')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [currentPage, setCurrentPage] = useState(initialListState.page)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [notices, setNotices] = useState([])
    const [searchInput, setSearchInput] = useState('')
    const [keyword, setKeyword] = useState('')
    const [searchType, setSearchType] = useState('all')
    const [appliedSearchType, setAppliedSearchType] = useState('all')

    const loadPosts = useCallback(async (page, sort, searchKeyword = keyword) => {
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
            if (searchKeyword) {
                params.set('keyword', searchKeyword)
                params.set('searchType', appliedSearchType)
            }
            const path = searchKeyword ? '/api/posts/search' : '/api/posts'
            const response = await fetch(`${path}?${params}`, {
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
            setNotices(searchKeyword ? [] : (data.notices ?? []))
            setTotalPages(data.totalPages ?? 0)
            setTotalElements(data.totalElements ?? 0)
            setMessage(data.totalElements > 0
                ? (searchKeyword ? `'${searchKeyword}' 검색 결과 ${data.totalElements}건` : `전체 ${data.totalElements}개의 게시글`)
                : (searchKeyword ? '검색 결과가 없습니다.' : '등록된 게시글이 없습니다.'))
        } catch (error) {
            const errorMessage = `게시글 목록 조회 실패: ${error.message}`
            setMessage(errorMessage)
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [auth, keyword, appliedSearchType])

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

    // 정렬 드롭다운을 강의/노트 목록 페이지와 같은 방식으로 바깥 클릭/ESC로 닫는다.
    useEffect(() => {
        if (!isSortOpen) return undefined

        const handleClickOutside = (e) => {
            if (sortRef.current && !sortRef.current.contains(e.target)) {
                setIsSortOpen(false)
            }
        }
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsSortOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isSortOpen])

    const changeSort = (value) => {
        movePage(1, value)
        setIsSortOpen(false)
    }

    const submitSearch = (event) => {
        event.preventDefault()
        setAppliedSearchType(searchType)
        setKeyword(searchInput.trim())
        setCurrentPage(1)
    }

    const clearSearch = () => {
        setSearchInput('')
        setKeyword('')
        setCurrentPage(1)
    }

    const renderPostItem = (post, keyPrefix = '') => (
        <article className={`post-card${post.notice ? ' post-card--notice' : ''}`} key={`${keyPrefix}${post.id}`}>
            <button
                type="button"
                className="post-card__link"
                style={{ border: 'none', background: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left', color: 'inherit', textDecoration: 'none' }}
                onClick={() => onOpenPost(post.id)}
            >
                <div className="post-card__body">
                    <div className="post-card__col post-card__col--title">
                        {post.notice && <span className="post-card__badge">공지</span>}
                        <h3 className="post-card__title">
                            {post.title}
                            {(post.commentCount ?? 0) > 0 && (
                                <span className="post-card__comment-count"> [{post.commentCount}]</span>
                            )}
                        </h3>
                    </div>
                    <div className="post-card__col post-card__col--author">{post.authorNickname || '알 수 없는 사용자'}</div>
                    <div className="post-card__col post-card__col--views">{post.viewCount ?? 0}</div>
                    <div className="post-card__col post-card__col--likes">{post.likeCount ?? 0}</div>
                    <div className="post-card__col post-card__col--date">{formatShortDate(post.notice ? post.updatedAt : post.createdAt)}</div>
                </div>
            </button>
            {post.thumbnailUrl && (
                /* 목록 행에 마우스를 올렸을 때만 본문의 첫 이미지로 만든 썸네일을 보여준다. */
                <div className="post-card__hover-thumb" aria-hidden="true">
                    <img src={post.thumbnailUrl} alt="" loading="lazy" draggable={false} />
                </div>
            )}
        </article>
    )

    return (
        <section className="community-board-page">
            <nav className="community-board-page__crumbs" aria-label="현재 위치">
                <Link to="/main">메인</Link>
                <span>/</span>
                <span className="is-current">커뮤니티</span>
            </nav>
            <h2>커뮤니티</h2>

            <div className="community-board-page__toolbar">
                <BoardSearchBar
                    value={searchInput}
                    onChange={setSearchInput}
                    searchType={searchType}
                    onSearchTypeChange={setSearchType}
                    onSubmit={submitSearch}
                    onClear={clearSearch}
                    placeholder="커뮤니티 글을 검색하세요"
                />
                <p className="community-board-page__summary">{message}</p>

                <div className="community-board-page__sort" ref={sortRef}>
                    <button
                        type="button"
                        className="community-board-page__sort-btn"
                        aria-haspopup="listbox"
                        aria-expanded={isSortOpen}
                        onClick={() => setIsSortOpen((prev) => !prev)}
                    >
                        <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                        <svg
                            className="community-board-page__sort-caret"
                            width="10"
                            height="6"
                            viewBox="0 0 10 6"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    {isSortOpen && (
                        <ul className="community-board-page__sort-menu" role="listbox" aria-label="정렬 기준">
                            {sortOptions.map((option) => (
                                <li key={option.value}>
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={sortBy === option.value}
                                        className={
                                            'community-board-page__sort-option' + (sortBy === option.value ? ' is-selected' : '')
                                        }
                                        onClick={() => changeSort(option.value)}
                                    >
                                        {option.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <button type="button" className="community-board-page__write-btn" onClick={onCreate}>
                    글쓰기
                </button>
            </div>

            {loading && <p>불러오는 중...</p>}
            {!loading && error && (
                <div role="alert">
                    <p>{error}</p>
                    <button type="button" onClick={() => loadPosts(currentPage, sortBy)}>다시 시도</button>
                </div>
            )}
            {!loading && !error && totalElements === 0 && notices.length === 0 && (
                <div className="community-board-page__empty">
                    <img src={DEFAULT_MAIN_IMAGE} alt="등록된 게시글 없음" />
                    <strong>아직 등록된 게시글이 없습니다.</strong>
                    <p>첫 번째 게시글을 작성해 보세요.</p>
                    <button type="button" onClick={onCreate}>게시글 작성</button>
                </div>
            )}

            {!loading && !error && (totalElements > 0 || notices.length > 0) && (
                <>
                    <div className="community-board-page__list-header" aria-hidden="true">
                        <span>제목</span>
                        <span>작성자</span>
                        <span>조회수</span>
                        <span>좋아요</span>
                        <span>작성일자</span>
                    </div>

                    {notices.length > 0 && (
                        <div className="community-board-page__list community-board-page__list--notice">
                            {notices.map((post) => renderPostItem(post, 'notice-'))}
                        </div>
                    )}

                    {posts.length > 0 && (
                        <div className="community-board-page__list">
                            {posts.map((post) => renderPostItem(post))}
                        </div>
                    )}

                    {totalElements > 0 && (
                        <div className="community-board-page__pagination">
                            <button
                                type="button"
                                className="community-board-page__page-btn community-board-page__page-btn--nav"
                                onClick={() => movePage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                이전
                            </button>
                            {getPageNumbers(currentPage, Math.max(totalPages, 1)).map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    className={
                                        'community-board-page__page-btn' + (num === currentPage ? ' is-active' : '')
                                    }
                                    aria-current={num === currentPage ? 'page' : undefined}
                                    onClick={() => movePage(num)}
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="community-board-page__page-btn community-board-page__page-btn--nav"
                                onClick={() => movePage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                다음
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    )
}

export default CommunityBoard
