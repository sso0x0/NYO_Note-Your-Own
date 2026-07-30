import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getCategoryList } from '../../lecture/api/category'
import BoardSearchBar from '../../../components/BoardSearchBar'
import '../components/NoteCard.css'
import './NoteBoard.css'

const sortOptions = [
    { value: 'createdAt', label: '최신순' },
    { value: 'likeCount', label: '인기순' },
    { value: 'viewCount', label: '조회수순' },
]

const NOTES_PER_PAGE = 10
const PAGE_WINDOW = 5
const NOTE_SORT_VALUES = new Set(sortOptions.map((option) => option.value))

const readListStateFromUrl = () => {
    const params = new URLSearchParams(window.location.search)
    const page = Number.parseInt(params.get('page') ?? '1', 10)
    const sort = params.get('sort') ?? 'createdAt'
    return {
        page: Number.isInteger(page) && page > 0 ? page : 1,
        sort: NOTE_SORT_VALUES.has(sort) ? sort : 'createdAt',
        keyword: params.get('keyword') ?? '',
        searchType: params.get('searchType') ?? 'all',
        categoryId: params.get('categoryId') ?? '',
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

function NoteBoard({ onOpenNote }) {
    const { auth } = useAuth()
    const [notes, setNotes] = useState([])
    const initialListState = readListStateFromUrl()
    const [sortBy, setSortBy] = useState(initialListState.sort)
    const [categories, setCategories] = useState([])
    const [categoryId, setCategoryId] = useState(initialListState.categoryId)
    // 노트 상세의 태그 칩을 눌러 들어오면 URL의 keyword로 해당 태그가 붙은 노트만 검색해 보여준다.
    const [keyword, setKeyword] = useState(initialListState.keyword)
    // 태그 필터 값은 검색창에 노출하지 않고, 사용자가 직접 입력한 일반 검색어만 보여준다.
    const [searchInput, setSearchInput] = useState(
        initialListState.searchType === 'tag' ? '' : initialListState.keyword
    )
    const [searchType, setSearchType] = useState(
        initialListState.searchType === 'tag' ? 'all' : initialListState.searchType
    )
    const [appliedSearchType, setAppliedSearchType] = useState(initialListState.searchType)
    const [isSortOpen, setIsSortOpen] = useState(false)
    const sortRef = useRef(null)
    const [message, setMessage] = useState('노트를 불러오는 중입니다.')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [currentPage, setCurrentPage] = useState(initialListState.page)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)

    const loadNotes = useCallback(async (page, sort, category, tagKeyword) => {
        setLoading(true)
        setError('')
        try {
            // 화면 페이지는 1부터 시작하지만 Spring Pageable은 0부터 시작하므로 1을 빼서 요청합니다.
            const params = new URLSearchParams({
                page: String(page - 1),
                size: String(NOTES_PER_PAGE),
            })
            // searchType=tag이면 백엔드가 제목·본문을 보지 않고 실제 태그 매핑이 같은 노트만 조회한다.
            let path = '/api/notes'
            if (tagKeyword) {
                params.set('keyword', tagKeyword)
                params.set('searchType', appliedSearchType)
                path = '/api/notes/search'
            } else {
                params.set('sort', `${sort},desc`)
                // 선택한 카테고리를 서버에 전달해 노트와 연결된 강의의 categoryId를 기준으로 필터링한다.
                if (category) params.set('categoryId', category)
            }
            const response = await fetch(`${path}?${params}`, {
                headers: { Authorization: `Bearer ${auth?.accessToken}` },
            })
            const data = await response.json()

            if (!response.ok) {
                const errorMessage = `노트 목록 조회 실패: HTTP ${response.status}`
                setMessage(errorMessage)
                setError(errorMessage)
                return
            }

            // 서버가 반환한 현재 페이지 내용과 전체 페이지 정보를 각각 화면 상태에 저장합니다.
            setNotes(data.content ?? [])
            setTotalPages(data.totalPages ?? 0)
            setTotalElements(data.totalElements ?? 0)
            if (tagKeyword) {
                setMessage(data.totalElements > 0
                    ? `'${tagKeyword}' 태그로 검색한 노트 ${data.totalElements}건`
                    : `'${tagKeyword}' 태그가 붙은 노트가 없습니다.`)
            } else {
                setMessage(data.totalElements > 0 ? `전체 ${data.totalElements}개의 노트` : '등록된 노트가 없습니다.')
            }
        } catch (error) {
            const errorMessage = `노트 목록 조회 실패: ${error.message}`
            setMessage(errorMessage)
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [auth, appliedSearchType])

    const movePage = useCallback((page, sort = sortBy, category = categoryId) => {
        const safePage = Math.max(1, page)
        // 목록 상태를 URL에 저장해 새로고침하거나 상세 화면에서 돌아와도 같은 위치를 복원합니다.
        const params = new URLSearchParams(window.location.search)
        params.set('page', String(safePage))
        params.set('sort', sort)
        if (category) params.set('categoryId', category)
        else params.delete('categoryId')
        if (keyword) params.set('keyword', keyword)
        else params.delete('keyword')
        window.history.pushState(null, '', `${window.location.pathname}?${params}`)
        setCurrentPage(safePage)
        setSortBy(sort)
        setCategoryId(category)
    }, [sortBy, categoryId, keyword])

    const clearTagFilter = useCallback(() => {
        // 태그 검색 결과에서 전체 노트 목록으로 되돌아간다.
        const params = new URLSearchParams(window.location.search)
        params.delete('keyword')
        params.delete('searchType')
        params.set('page', '1')
        params.set('sort', sortBy)
        window.history.pushState(null, '', `${window.location.pathname}?${params}`)
        setKeyword('')
        setSearchInput('')
        setCurrentPage(1)
    }, [sortBy])

    const submitSearch = (event) => {
        event.preventDefault()
        const nextKeyword = searchInput.trim()
        setAppliedSearchType(searchType)
        setKeyword(nextKeyword)
        setCategoryId('')
        setCurrentPage(1)
        const params = new URLSearchParams({ page: '1', sort: sortBy })
        if (nextKeyword) {
            params.set('keyword', nextKeyword)
            params.set('searchType', searchType)
        }
        window.history.pushState(null, '', `${window.location.pathname}?${params}`)
    }

    const openTagPage = useCallback((event, tagName) => {
        // 카드 클릭과 태그 클릭을 분리하고, 노트 상세의 태그 이동과 같은 검색 URL을 사용한다.
        event.stopPropagation()
        const params = new URLSearchParams()
        params.set('keyword', tagName)
        params.set('searchType', 'tag')
        params.set('page', '1')
        params.set('sort', sortBy)
        window.history.pushState(null, '', `${window.location.pathname}?${params}`)
        setKeyword(tagName)
        setSearchInput('')
        setAppliedSearchType('tag')
        setCategoryId('')
        setCurrentPage(1)
    }, [sortBy])

    useEffect(() => {
        // 강의 목록 페이지와 동일한 카테고리 목록을 가져와 노트 게시판 필터로 표시한다.
        getCategoryList()
            .then(setCategories)
            .catch(() => setCategories([]))
    }, [])

    useEffect(() => {
        // 브라우저 뒤로가기/앞으로가기 시 주소의 페이지와 정렬 조건을 목록 상태에 다시 반영합니다.
        const restoreListState = () => {
            const restored = readListStateFromUrl()
            setCurrentPage(restored.page)
            setSortBy(restored.sort)
            setCategoryId(restored.categoryId)
            setKeyword(restored.keyword)
            setSearchInput(restored.searchType === 'tag' ? '' : restored.keyword)
            setAppliedSearchType(restored.searchType)
            setSearchType(restored.searchType === 'tag' ? 'all' : restored.searchType)
        }
        window.addEventListener('popstate', restoreListState)
        return () => window.removeEventListener('popstate', restoreListState)
    }, [])

    useEffect(() => {
        // 최초 목록 진입 시에도 현재 상태를 URL에 표시해 새로고침 복원이 가능하게 합니다.
        const params = new URLSearchParams(window.location.search)
        params.set('page', String(currentPage))
        params.set('sort', sortBy)
        if (categoryId) params.set('categoryId', categoryId)
        if (keyword) params.set('keyword', keyword)
        if (keyword) params.set('searchType', appliedSearchType)
        window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
        // URL 초기화는 컴포넌트가 처음 열릴 때 한 번만 수행합니다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        // 초기 API 조회는 외부 서버 상태를 React 목록 상태와 동기화하기 위해 필요합니다.
        // 페이지, 정렬, 카테고리, 태그 검색어가 바뀔 때 해당하는 페이지만 서버에서 다시 조회합니다.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadNotes(currentPage, sortBy, categoryId, keyword)
    }, [currentPage, sortBy, categoryId, keyword, loadNotes])

    // 정렬 드롭다운을 강의 목록 페이지와 같은 방식으로 바깥 클릭/ESC로 닫는다.
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

    const changeCategory = (nextCategoryId) => {
        movePage(1, sortBy, nextCategoryId)
    }

    return (
        <section className="note-board-page">
            <nav className="note-board-page__crumbs" aria-label="현재 위치">
                <Link to="/main">메인</Link>
                <span>/</span>
                <span className="is-current">노트 게시판</span>
            </nav>
            <h2>노트 게시판</h2>
            <div className="note-board-page__search-row">
                <BoardSearchBar
                    value={searchInput}
                    onChange={setSearchInput}
                    searchType={searchType}
                    onSearchTypeChange={setSearchType}
                    onSubmit={submitSearch}
                    onClear={clearTagFilter}
                    placeholder="노트를 검색하세요"
                />
                {/* 노트 수와 정렬을 검색창 오른쪽 같은 줄에 배치한다. */}
                <p className="note-board-page__summary">{message}</p>

                {!keyword && (
                    <div className="note-board-page__sort" ref={sortRef}>
                        <button
                            type="button"
                            className="note-board-page__sort-btn"
                            aria-haspopup="listbox"
                            aria-expanded={isSortOpen}
                            onClick={() => setIsSortOpen((prev) => !prev)}
                        >
                            <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                            <svg
                                className="note-board-page__sort-caret"
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
                            <ul className="note-board-page__sort-menu" role="listbox" aria-label="정렬 기준">
                                {sortOptions.map((option) => (
                                    <li key={option.value}>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={sortBy === option.value}
                                            className={
                                                'note-board-page__sort-option' + (sortBy === option.value ? ' is-selected' : '')
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
                )}
            </div>

            <div className="note-board-page__toolbar">
                {keyword ? (
                    <div className="note-board-page__filters">
                        <button type="button" onClick={clearTagFilter}>전체 노트 보기</button>
                    </div>
                ) : (
                    categories.length > 0 && (
                        <div className="note-board-page__filters" role="group" aria-label="카테고리 필터">
                            <button
                                type="button"
                                className={categoryId === '' ? 'is-active' : ''}
                                onClick={() => changeCategory('')}
                            >
                                전체
                            </button>
                            {categories.map((category) => {
                                const value = String(category.id)
                                return (
                                    <button
                                        type="button"
                                        key={category.id}
                                        className={categoryId === value ? 'is-active' : ''}
                                        onClick={() => changeCategory(value)}
                                    >
                                        {category.name}
                                    </button>
                                )
                            })}
                        </div>
                    )
                )}

            </div>

            {loading && <p>불러오는 중...</p>}
            {!loading && error && <p role="alert">{error}</p>}
            {!loading && !error && totalElements === 0 && (
                <div className="note-board-page__empty">등록된 노트가 없습니다.</div>
            )}
            {!loading && !error && totalElements > 0 && (
                <>
                    <div className="note-board-page__list">
                        {notes.map((note) => (
                            <article className="note-card" key={note.id}>
                                {/* 패딩은 CSS에서 관리해 썸네일 좌우 여백이 동일하게 적용되도록 한다. */}
                                <button
                                    type="button"
                                    className="note-card__link"
                                    style={{ border: 'none', background: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                                    onClick={() => onOpenNote(note.id)}
                                >
                                    <div className="note-card__thumb">
                                        {note.thumbnailUrl ? (
                                            <img src={note.thumbnailUrl} alt={note.title} loading="lazy" />
                                        ) : (
                                            /* 대표 이미지가 없는 노트 카드에 노트 전용 기본 이미지를 표시한다. */
                                            <img
                                                className="note-card__thumb-fallback-image"
                                                src="/images/note-empty.png"
                                                alt=""
                                                draggable={false}
                                            />
                                        )}
                                    </div>

                                    <div className="note-card__body">
                                        {(note.categoryName || note.lectureTitle) && (
                                            <div className="note-card__eyebrow">
                                                {note.categoryName && <span className="note-card__category">{note.categoryName}</span>}
                                                {note.lectureTitle && <span className="note-card__lecture">{note.lectureTitle}</span>}
                                            </div>
                                        )}
                                        <h3 className="note-card__title">{note.title}</h3>
                                        <p className="note-card__author">{note.authorNickname || '알 수 없는 사용자'}</p>

                                        {note.tags?.length > 0 && (
                                            <div className="note-card__tags">
                                                {note.tags.map((tag) => (
                                                    <span
                                                        key={tag.tagId}
                                                        className="note-card__tag note-card__tag--clickable"
                                                        role="link"
                                                        tabIndex={0}
                                                        onClick={(event) => openTagPage(event, tag.tagName)}
                                                        onKeyDown={(event) => {
                                                            if (event.key === 'Enter' || event.key === ' ') {
                                                                event.preventDefault()
                                                                openTagPage(event, tag.tagName)
                                                            }
                                                        }}
                                                    >
                                                        {tag.isAiGenerated && <span className="note-card__tag-ai">AI</span>}
                                                        #{tag.tagName}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="note-card__meta">
                                            <span>조회 {note.viewCount ?? 0}</span>
                                            <span>좋아요 {note.likeCount ?? 0}</span>
                                            {note.createdAt && <span>{note.createdAt.slice(0, 10)}</span>}
                                        </div>
                                    </div>
                                </button>
                            </article>
                        ))}
                    </div>

                    <div className="note-board-page__pagination">
                        <button
                            type="button"
                            className="note-board-page__page-btn note-board-page__page-btn--nav"
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
                                    'note-board-page__page-btn' + (num === currentPage ? ' is-active' : '')
                                }
                                aria-current={num === currentPage ? 'page' : undefined}
                                onClick={() => movePage(num)}
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="note-board-page__page-btn note-board-page__page-btn--nav"
                            onClick={() => movePage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            다음
                        </button>
                    </div>
                </>
            )}
        </section>
    )
}

export default NoteBoard
