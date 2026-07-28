import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { getCategoryList } from '../../lecture/api/category'
const sortOptions = [
    { value: 'createdAt', label: '최신순' },
    { value: 'likeCount', label: '좋아요' },
    { value: 'viewCount', label: '조회수' },
    { value: 'createdAt', label: '최신순' },
    { value: 'likeCount', label: '좋아요' },
    { value: 'viewCount', label: '조회수' },
]
const NOTES_PER_PAGE = 12
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
    const params = new URLSearchParams(window.location.search)
    const page = Number.parseInt(params.get('page') ?? '1', 10)
    const sort = params.get('sort') ?? 'createdAt'
    return {
        page: Number.isInteger(page) && page > 0 ? page : 1,
        sort: NOTE_SORT_VALUES.has(sort) ? sort : 'createdAt',
        keyword: params.get('keyword') ?? '',
        categoryId: params.get('categoryId') ?? '',
    }
}
function NoteBoard({ onCreate, onOpenNote }) {
    const { auth } = useAuth()
    const [notes, setNotes] = useState([])
    const initialListState = readListStateFromUrl()
    const [sortBy, setSortBy] = useState(initialListState.sort)
    const [message, setMessage] = useState('노트를 불러오는 중입니다.')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [currentPage, setCurrentPage] = useState(initialListState.page)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const loadNotes = useCallback(async (page, sort) => {
        setLoading(true)
        setError('')
        try {
            // 화면 페이지는 1부터 시작하지만 Spring Pageable은 0부터 시작하므로 1을 빼서 요청합니다.
            const params = new URLSearchParams({
                page: String(page - 1),
                size: String(NOTES_PER_PAGE),
                sort: `${sort},desc`,
            })
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
            function NoteBoard({ onOpenNote }) {
                const { auth } = useAuth()
                const [notes, setNotes] = useState([])
                const initialListState = readListStateFromUrl()
                const [sortBy, setSortBy] = useState(initialListState.sort)
                const [categories, setCategories] = useState([])
                const [categoryId, setCategoryId] = useState(initialListState.categoryId)
                // 노트 상세의 태그 칩을 눌러 들어오면 URL의 keyword로 해당 태그가 붙은 노트만 검색해 보여준다.
                const [keyword, setKeyword] = useState(initialListState.keyword)
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
                        // 태그 검색은 제목/본문/태그를 함께 보는 Elasticsearch 검색 API를 그대로 재사용한다 (관련도순 정렬).
                        let path = '/api/notes'
                        if (tagKeyword) {
                            params.set('keyword', tagKeyword)
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
                }, [auth?.accessToken])
