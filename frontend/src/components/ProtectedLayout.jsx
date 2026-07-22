import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import nyoLogo from '../assets/images/nyo_logo.png';
import ChatWidget from '../features/chat/ChatWidget';
import './ProtectedLayout.css';

// 로그인 후 화면 전체에서 공통으로 보이는 헤더 + 페이지 전환 네비게이션.
// 새 기능 페이지를 /main 하위 라우트로 추가했다면 여기에도 링크를 추가해야 메뉴에서 보인다.
// 챗봇은 라우트가 아니라 ChatWidget(우하단 플로팅 아이콘)으로 모든 페이지에 떠 있다.
function ProtectedLayout() {
  const { auth, logout } = useAuth();

  // ProtectedRoute redirects to /login as soon as auth clears, so we only
  // need to clear it here — navigating manually races with that redirect
  // and can leave the URL out of sync with the rendered page.
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="protected-layout">
      <header className="protected-layout__header">
        <Link to="/main" className="protected-layout__logo">
          <span className="protected-layout__logo-mark">
            <img src={nyoLogo} alt="NYO" />
          </span>
        </Link>
        <nav className="protected-layout__nav">
          <NavLink to="/main" end>강의</NavLink>
          <NavLink to="/main/pomodoro">뽀모도로</NavLink>
        </nav>
        <div className="protected-layout__user">
          <span>{auth?.nickname}님 환영합니다</span>
          <button type="button" onClick={handleLogout}>로그아웃</button>
        </div>
      </header>
      <main className="protected-layout__content">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
}

export default ProtectedLayout;
