import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import nyoLogo from '../assets/images/nyo_logo.png';
import './ProtectedLayout.css';

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
        <div className="protected-layout__user">
          <span>{auth?.nickname}님 환영합니다</span>
          <button type="button" onClick={handleLogout}>로그아웃</button>
        </div>
      </header>
      <main className="protected-layout__content">
        <Outlet />
      </main>
    </div>
  );
}

export default ProtectedLayout;
