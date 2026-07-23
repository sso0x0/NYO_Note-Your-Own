import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LectureListPage from './pages/LectureListPage';
import LectureDetailPage from './pages/LectureDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedLayout from './components/ProtectedLayout';
import NoteSectionRoutes from './pages/NoteSectionRoutes';
import CommunitySectionRoutes from './pages/CommunitySectionRoutes';
import './App.css';

function App() {
  return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/main" element={<ProtectedLayout />}>
            <Route index element={<LectureListPage />} />
            <Route path="lectures/:id" element={<LectureDetailPage />} />
            {/* 기존 노트와 커뮤니티 기능을 로그인 후 /main 하위 주소에 연결합니다. */}
            <Route path="notes/*" element={<NoteSectionRoutes />} />
            <Route path="community/*" element={<CommunitySectionRoutes />} />
          </Route>
        </Route>
      </Routes>
  );
}

export default App;
