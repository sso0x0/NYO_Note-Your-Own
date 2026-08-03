import { Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import CommunityBoard from './CommunityBoard'
import CommunityCreate from './CommunityCreate'
import CommunityDetail from './CommunityDetail'
import CommunityEdit from './CommunityEdit'

// 커뮤니티 목록 화면에 글쓰기/상세 이동 핸들러를 연결한다.
function CommunityBoardRoute() {
    const navigate = useNavigate()
    const location = useLocation()

    return (
        <CommunityBoard
            onCreate={() => navigate({ pathname: 'new', search: location.search })}
            // 상세 화면에도 목록 쿼리를 전달해 돌아올 때 페이지와 정렬 조건을 복원합니다.
            onOpenPost={(postId) => navigate({ pathname: String(postId), search: location.search })}
        />
    )
}

// 게시글 작성 화면에 목록으로 돌아가기/작성 완료 후 이동 핸들러를 연결한다.
function CommunityCreateRoute() {
    const navigate = useNavigate()
    const location = useLocation()
    const listUrl = { pathname: '/main/community', search: location.search }

    return <CommunityCreate onBack={() => navigate(listUrl)} onCreated={(postId) => navigate({ pathname: `/main/community/${postId}`, search: location.search })} />
}

// 게시글 상세 화면에 postId와 목록/수정 이동 핸들러를 연결한다.
function CommunityDetailRoute() {
    const { postId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    return (
        <CommunityDetail
            postId={postId}
            onBack={() => navigate({ pathname: '/main/community', search: location.search })}
            onEdit={() => navigate({ pathname: 'edit', search: location.search })}
        />
    )
}

// 게시글 수정 화면에 postId와 저장/취소 후 상세로 돌아가는 핸들러를 연결한다.
function CommunityEditRoute() {
    const { postId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const detailUrl = { pathname: `/main/community/${postId}`, search: location.search }

    return <CommunityEdit postId={postId} onBack={() => navigate(detailUrl)} onSaved={() => navigate(detailUrl)} />
}

// /main/community 하위 라우트(목록·작성·상세·수정)를 모아서 관리합니다.
// 목록의 쿼리(search)를 각 화면에 계속 전달해 뒤로 돌아올 때 페이지/정렬 상태를 복원합니다.
function CommunitySectionRoutes() {
    return (
        <Routes>
            <Route index element={<CommunityBoardRoute />} />
            <Route path="new" element={<CommunityCreateRoute />} />
            <Route path=":postId" element={<CommunityDetailRoute />} />
            <Route path=":postId/edit" element={<CommunityEditRoute />} />
        </Routes>
    )
}

export default CommunitySectionRoutes
