import { Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import NoteBoard from './NoteBoard'
import NoteCreate from './NoteCreate'
import NoteDetail from './NoteDetail'
import NoteEdit from './NoteEdit'

function NoteBoardRoute() {
    const navigate = useNavigate()
    const location = useLocation()

    return (
        <NoteBoard
            onCreate={() => navigate({ pathname: 'new', search: location.search })}
            // 상세 화면에도 목록 쿼리를 전달해 돌아올 때 페이지와 정렬 조건을 복원합니다.
            onOpenNote={(noteId) => navigate({ pathname: String(noteId), search: location.search })}
        />
    )
}

function NoteCreateRoute() {
    const navigate = useNavigate()
    const location = useLocation()
    const listUrl = { pathname: '/main/notes', search: location.search }

    return <NoteCreate onBack={() => navigate(listUrl)} onCreated={(noteId) => navigate({ pathname: `/main/notes/${noteId}`, search: location.search })} />
}

function NoteDetailRoute() {
    const { noteId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    return (
        <NoteDetail
            noteId={noteId}
            onBack={() => navigate({ pathname: '/main/notes', search: location.search })}
            onEdit={() => navigate({ pathname: 'edit', search: location.search })}
        />
    )
}

function NoteEditRoute() {
    const { noteId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const detailUrl = { pathname: `/main/notes/${noteId}`, search: location.search }

    return <NoteEdit noteId={noteId} onBack={() => navigate(detailUrl)} onSaved={() => navigate(detailUrl)} />
}

// 기존 노트 화면을 /main/notes 아래의 목록·작성·상세·수정 URL에 연결합니다.
function NoteSectionRoutes() {
    return (
        <Routes>
            <Route index element={<NoteBoardRoute />} />
            <Route path="new" element={<NoteCreateRoute />} />
            <Route path=":noteId" element={<NoteDetailRoute />} />
            <Route path=":noteId/edit" element={<NoteEditRoute />} />
        </Routes>
    )
}

export default NoteSectionRoutes
