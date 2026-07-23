import { Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import CommunityBoard from './CommunityBoard'
import CommunityCreate from './CommunityCreate'
import CommunityDetail from './CommunityDetail'
import CommunityEdit from './CommunityEdit'

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

function CommunityCreateRoute() {
    const navigate = useNavigate()
    const location = useLocation()
    const listUrl = { pathname: '/main/community', search: location.search }

    return <CommunityCreate onBack={() => navigate(listUrl)} onCreated={(postId) => navigate({ pathname: `/main/community/${postId}`, search: location.search })} />
}

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
