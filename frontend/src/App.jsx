import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import LectureListPage from './pages/LectureListPage';
import LectureDetailPage from './pages/LectureDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedLayout from './components/ProtectedLayout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* ProtectedRoute가 비로그인 접근을 /login으로 리다이렉트하므로, 아래 자식 라우트는
          전부 로그인 이후에만 렌더링된다는 전제로 작성해도 된다. */}
      <Route element={<ProtectedRoute />}>
        <Route path="/main" element={<ProtectedLayout />}>
          {/* 홈: 기존 그대로 유지되는 강의 목록(페이지네이션) 화면 */}
          <Route index element={<LectureListPage />} />
          {/* 강의: 검색/카테고리/추천 강의 카드로 구성된 새 화면 */}
          <Route path="lectures" element={<HomePage />} />
          <Route path="lectures/:id" element={<LectureDetailPage />} />
          {/* 뽀모도로/챗봇: AI 기능 파트. 별도 라우트가 아니라 ProtectedLayout의
              WidgetDock(플로팅 아이콘 2개)으로 모든 페이지에서 접근한다. */}
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
