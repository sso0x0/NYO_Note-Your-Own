import { NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';

function AdminLayout() {
  return (
    <section className="admin-layout">
      <h2>관리자</h2>
      <nav className="admin-layout__nav">
        <NavLink to="/main/admin" end className={({ isActive }) => (isActive ? 'is-active' : '')}>
          대시보드
        </NavLink>
        <NavLink to="/main/admin/users" className={({ isActive }) => (isActive ? 'is-active' : '')}>
          회원 관리
        </NavLink>
        <NavLink to="/main/admin/lectures" className={({ isActive }) => (isActive ? 'is-active' : '')}>
          강의 관리
        </NavLink>
        <NavLink to="/main/admin/moderation" className={({ isActive }) => (isActive ? 'is-active' : '')}>
          게시물 관리
        </NavLink>
      </nav>
      <div className="admin-layout__content">
        <Outlet />
      </div>
    </section>
  );
}

export default AdminLayout;
