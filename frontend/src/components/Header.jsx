import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import nyoLogo from '../assets/images/nyo_logo.png';
import './Header.css';

// 로그인 후 화면 전체에서 공통으로 보이는 상단 헤더 + 페이지 전환 네비게이션.
// 새 기능 페이지를 /main 하위 라우트로 추가했다면 여기에도 링크를 추가해야 메뉴에서 보인다.
function Header() {
  const { auth, logout } = useAuth();

  // router의 navigate()로 이동시키면 auth가 사라진 순간 ProtectedRoute가
  // 옛 위치(/main) 기준으로 다시 렌더링되면서 /login으로 되돌리는 레이스가 생긴다.
  // 그래서 로그아웃은 SPA 이동 대신 전체 페이지 이동으로 랜딩 페이지에 확실히 도착시킨다.
  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header className="app-header">
      <Link to="/main" className="app-header__logo">
        <span className="app-header__logo-mark">
          <img src={nyoLogo} alt="NYO" />
        </span>
      </Link>
      <nav className="app-header__nav">
        <NavLink to="/main/lectures" className={({ isActive }) => (isActive ? 'is-active' : '')}>
          강의
        </NavLink>
        <NavLink to="/main/notes" className={({ isActive }) => (isActive ? 'is-active' : '')}>
          노트
        </NavLink>
        <NavLink to="/main/community" className={({ isActive }) => (isActive ? 'is-active' : '')}>
          커뮤니티
        </NavLink>
        <NavLink to="/main/chat" className={({ isActive }) => (isActive ? 'is-active' : '')}>
          AI 챗봇
        </NavLink>
        <NavLink to="/main/mypage" className={({ isActive }) => (isActive ? 'is-active' : '')}>
          마이페이지
        </NavLink>
        {auth?.role === 'ADMIN' && (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'is-active' : '')}>
            관리자
          </NavLink>
        )}
      </nav>
      <div className="app-header__user">
        <span>{auth?.nickname}님 환영합니다</span>
        <button type="button" onClick={handleLogout}>로그아웃</button>
      </div>
    </header>
  );
}

export default Header;
