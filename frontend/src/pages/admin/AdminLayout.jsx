import { Link, NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';

// 강의 관리/회원 관리/게시물 관리는 아직 뒷단(백엔드 API 자체는 있지만 화면 미구현)이라
// 자리표시자로만 둔다. 만들게 되면 각 자리에 NavLink + <Route>만 추가하면 된다.
const PLACEHOLDER_NAV = ['강의 관리', '회원 관리', '게시물 관리'];

function AdminLayout() {
  return (
      <div className="admin-layout">
        <aside className="admin-layout__sidebar">
          <Link to="/admin" className="admin-layout__logo">NYO Admin</Link>
          <nav className="admin-layout__nav">
            <NavLink to="/admin" end>대시보드</NavLink>
            {PLACEHOLDER_NAV.map((label) => (
                <span key={label} className="admin-layout__nav-placeholder">
              {label}
                  <span className="admin-layout__nav-soon">준비 중</span>
            </span>
            ))}
          </nav>
          <Link to="/main" className="admin-layout__back">← 메인으로</Link>
        </aside>
        <main className="admin-layout__content">
          <Outlet />
        </main>
      </div>
  );
}

export default AdminLayout;
