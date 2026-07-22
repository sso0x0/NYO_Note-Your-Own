import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LectureListPage from './pages/LectureListPage';
import LectureDetailPage from './pages/LectureDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedLayout from './components/ProtectedLayout';
import PomodoroPage from './features/pomodoro/PomodoroPage';
import ChatPage from './features/chat/ChatPage';

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
          <Route index element={<LectureListPage />} />
          <Route path="lectures/:id" element={<LectureDetailPage />} />
          {/* 뽀모도로/챗봇: AI 기능 파트. 새 페이지를 추가하면 ProtectedLayout의 nav에도 링크를 추가할 것 */}
          <Route path="pomodoro" element={<PomodoroPage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
