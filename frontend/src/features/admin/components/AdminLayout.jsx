import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './AdminLayout.css';

const NAV_ITEMS = [
  { to: '/admin', label: '대시보드', end: true },
  { to: '/admin/lectures', label: '강의 관리' },
  { to: '/admin/users', label: '회원 관리' },
  { to: '/admin/moderation', label: '게시물 관리' },
  { to: '/admin/notes', label: '노트 관리' },
];

// 일반 회원용 ProtectedLayout(헤더/네비게이션)을 공유하지 않는 관리자 전용 콘솔 셸.
// 블랙 사이드바 + 화이트 콘텐츠 영역으로 회원 화면과 시각적으로 분리한다.
function AdminLayout() {
  const { auth, logout } = useAuth();
  const location = useLocation();

  const currentNavItem = NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );
  const pageTitle = currentNavItem?.label ?? '대시보드';

  return (
    <div className="admin-shell">
      <aside className="admin-shell__sidebar">
        <div className="admin-shell__brand">
          NYO<span>Admin</span>
        </div>
        <nav className="admin-shell__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-shell__nav-item${isActive ? ' is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/main" className="admin-shell__exit">
          ← 사이트로 돌아가기
        </Link>
      </aside>

      <div className="admin-shell__body">
        <header className="admin-shell__topbar">
          <span className="admin-shell__topbar-title">{pageTitle}</span>
          <div className="admin-shell__topbar-user">
            <span>{auth?.nickname}님</span>
            <button type="button" onClick={logout}>로그아웃</button>
          </div>
        </header>
        <main className="admin-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
