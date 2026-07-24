import { Route, Routes } from 'react-router-dom';
import LandingPage from './features/landing/pages/LandingPage';
import LoginPage from './features/auth/pages/LoginPage';
import SignupPage from './features/auth/pages/SignupPage';
import LectureListPage from './features/lecture/pages/LectureListPage';
import LectureDetailPage from './features/lecture/pages/LectureDetailPage';
import OAuth2RedirectPage from './features/auth/pages/OAuth2RedirectPage';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedLayout from './components/ProtectedLayout';
import MainPage from './features/main/pages/MainPage';
import MyPage from './features/mypage/pages/MyPage';
import AdminSectionRoutes from './features/admin/AdminSectionRoutes';
import NoteSectionRoutes from './features/note/pages/NoteSectionRoutes';
import CommunitySectionRoutes from './features/community/pages/CommunitySectionRoutes';
import './App.css';

function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectPage />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/main" element={<ProtectedLayout />}>
                    <Route index element={<MainPage />} />
                    <Route path="lectures" element={<LectureListPage />} />
                    <Route path="lectures/:id" element={<LectureDetailPage />} />
                    {/* 기존 노트와 커뮤니티 기능을 로그인 후 /main 하위 주소에 연결합니다. */}
                    <Route path="notes/*" element={<NoteSectionRoutes />} />
                    <Route path="community/*" element={<CommunitySectionRoutes />} />
                    <Route path="mypage" element={<MyPage />} />
                    <Route path="admin/*" element={<AdminSectionRoutes />} />
                </Route>
            </Route>
        </Routes>
    );
}

export default App;
