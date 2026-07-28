import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { getCategoryList } from '../../lecture/api/category'

const sortOptions = [
    { value: 'createdAt', label: '최신순' },
    { value: 'likeCount', label: '좋아요' },
    { value: 'viewCount', label: '조회수' },
]

const NOTES_PER_PAGE = 15
const PAGES_PER_GROUP = 10
const DEFAULT_MAIN_IMAGE = '/images/nullimg.png'
const NOTE_SORT_VALUES = new Set(sortOptions.map((option) => option.value))

const readListStateFromUrl = () => {
    const params = new URLSearchParams(window.location.search)
    const page = Number.parseInt(params.get('page') ?? '1', 10)
    const sort = params.get('sort') ?? 'createdAt'
    return {
        page: Number.isInteger(page) && page > 0 ? page : 1,
        sort: NOTE_SORT_VALUES.has(sort) ? sort : 'createdAt',
    }
}

function NoteBoard({ onOpenNote }) {
    const { auth } = useAuth()
    const [notes, setNotes] = useState([])
    const initialListState = readListStateFromUrl()
    const [sortBy, setSortBy] = useState(initialListState.sort)
    const [categories, setCategories] = useState([])
    const [categoryId, setCategoryId] = useState(new URLSearchParams(window.location.search).get('categoryId') ?? '')
    const [message, setMessage] = useState('노트를 불러오는 중입니다.')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [currentPage, setCurrentPage] = useState(initialListState.page)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)

    const loadNotes = useCallback(async (page, sort, category = categoryId) => {
        setLoading(true)
        setError('')
        try {
            // 화면 페이지는 1부터 시작하지만 Spring Pageable은 0부터 시작하므로 1을 빼서 요청합니다.
            const params = new URLSearchParams({
                page: String(page - 1),
                size: String(NOTES_PER_PAGE),
                sort: `${sort},desc`,
            })
            // 선택한 카테고리를 서버에 전달해 노트와 연결된 강의의 categoryId를 기준으로 필터링한다.
            if (category) params.set('categoryId', category)
            const response = await fetch(`/api/notes?${params}`, {
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
            setMessage(data.totalElements > 0 ? `전체 ${data.totalElements}개의 노트` : '등록된 노트가 없습니다.')
        } catch (error) {
            const errorMessage = `노트 목록 조회 실패: ${error.message}`
            setMessage(errorMessage)
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [auth?.accessToken, categoryId])

    const movePage = useCallback((page, sort = sortBy, category = categoryId) => {
        const safePage = Math.max(1, page)
        // 목록 상태를 URL에 저장해 새로고침하거나 상세 화면에서 돌아와도 같은 위치를 복원합니다.
        const params = new URLSearchParams(window.location.search)
        params.set('page', String(safePage))
        params.set('sort', sort)
        if (category) params.set('categoryId', category)
        else params.delete('categoryId')
        window.history.pushState(null, '', `${window.location.pathname}?${params}`)
        setCurrentPage(safePage)
        setSortBy(sort)
        setCategoryId(category)
    }, [sortBy, categoryId])

    useEffect(() => {
        // 강의 게시판과 동일한 카테고리 목록을 가져와 노트 게시판 정렬 옆 선택 칸에 표시한다.
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
            setCategoryId(new URLSearchParams(window.location.search).get('categoryId') ?? '')
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
        window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
        // URL 초기화는 컴포넌트가 처음 열릴 때 한 번만 수행합니다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        // 초기 API 조회는 외부 서버 상태를 React 목록 상태와 동기화하기 위해 필요합니다.
        // 페이지나 정렬 조건이 바뀔 때 해당하는 12개만 서버에서 다시 조회합니다.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadNotes(currentPage, sortBy, categoryId)
    }, [currentPage, sortBy, categoryId, loadNotes])
    // 페이지 번호가 많아져도 한 번에 10개만 표시하고 이전/다음으로 묶음을 이동합니다.
    const pageGroupStart = Math.floor((currentPage - 1) / PAGES_PER_GROUP) * PAGES_PER_GROUP + 1
    const pageGroupEnd = Math.min(pageGroupStart + PAGES_PER_GROUP - 1, totalPages)
    const visiblePages = Array.from(
        { length: pageGroupEnd - pageGroupStart + 1 },
        (_, index) => pageGroupStart + index,
    )

    const changeSort = (event) => {
        movePage(1, event.target.value)
    }

    const changeCategory = (nextCategoryId) => {
        movePage(1, sortBy, nextCategoryId)
    }

    return (
        <>
            <header className="note-header">
                <div>
                    <h1>노트 게시판</h1>
                </div>
            </header>

            <section className="note-list-panel">
                <div className="note-section-title">
                    <p>{message}</p>
                </div>

                <div className="note-list-controls">
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
                    {/* 강의 게시판처럼 전체와 각 강의 카테고리를 독립된 버튼으로 표시한다. */}
                    <div className="note-category-buttons" role="group" aria-label="강의 카테고리 필터">
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
                </div>

                {/* 목록 상태를 로딩/오류/빈 목록/정상 목록으로 분리해 사용자가 현재 상태를 알 수 있게 합니다. */}
                {loading && (
                    <div className="board-state" role="status">
                        <span className="board-loading-spinner" aria-hidden="true" />
                        <strong>노트를 불러오는 중입니다.</strong>
                    </div>
                )}

                {!loading && error && (
                    <div className="board-state board-error" role="alert">
                        <strong>노트를 불러오지 못했습니다.</strong>
                        <p>{error}</p>
                        <button type="button" onClick={() => loadNotes(currentPage, sortBy)}>다시 시도</button>
                    </div>
                )}

                {!loading && !error && totalElements === 0 && (
                    <div className="board-state board-empty">
                        {/* 빈 목록 안내에서는 기본 이미지(nullimg)를 표시하지 않고 문구만 보여준다. */}
                        <strong>아직 등록된 노트가 없습니다.</strong>
                        <p>강의 시청 화면에서 노트를 작성할 수 있습니다.</p>
                    </div>
                )}

                {/* 노트 카드 게시판: 서버에서 받은 현재 페이지의 노트 최대 15개를 5열×3행으로 표시합니다. */}
                {!loading && !error && totalElements > 0 && <ul className="note-card-grid">
                    {notes.map((note) => (
                        <li className="note-card" key={note.id}>
                            <button type="button" onClick={() => onOpenNote(note.id)}>
                                {/* 기본 메인 이미지: 이미지가 없거나 URL 로딩에 실패하면 nullimg.png를 표시합니다. */}
                                <img
                                    className="note-card-image"
                                    src={note.thumbnailUrl || DEFAULT_MAIN_IMAGE}
                                    alt={`${note.title} 메인 이미지`}
                                    onError={(event) => {
                                        if (!event.currentTarget.src.endsWith(DEFAULT_MAIN_IMAGE)) {
                                            event.currentTarget.src = DEFAULT_MAIN_IMAGE
                                        }
                                    }}
                                />
                                <strong className="note-card-title">{note.title}</strong>
                                <span className="note-card-author">{note.authorNickname || '알 수 없는 사용자'}</span>
                            </button>
                        </li>
                    ))}
                </ul>}

                {!loading && !error && totalElements > 0 && (
                    // 노트 서버 페이지 선택: 서버가 반환한 전체 페이지를 10페이지 단위로 표시합니다.
                    <nav className="note-pagination" aria-label="노트 페이지 선택">
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

export default NoteBoard
