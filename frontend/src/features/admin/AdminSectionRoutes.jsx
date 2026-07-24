import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from './components/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminLecturesPage from './pages/AdminLecturesPage';
import AdminLectureFormPage from './pages/AdminLectureFormPage';
import AdminModerationPage from './pages/AdminModerationPage';
import AdminNotesPage from './pages/AdminNotesPage';

// 관리자 전용 화면을 /admin 하위 주소에 연결합니다. 일반 회원용 헤더/네비게이션과는
// 완전히 분리된 별도 콘솔입니다. 일반 회원이 URL을 직접 입력해도 접근하지 못하도록
// role을 확인해 아니면 메인으로 돌려보냅니다 (백엔드도 /api/admin/**을 hasRole("ADMIN")으로
// 이미 막고 있어 이건 UX용 2차 방어입니다).
function AdminSectionRoutes() {
  const { auth } = useAuth();

  if (auth?.role !== 'ADMIN') {
    return <Navigate to="/main" replace />;
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="lectures" element={<AdminLecturesPage />} />
        <Route path="lectures/new" element={<AdminLectureFormPage />} />
        <Route path="lectures/:id/edit" element={<AdminLectureFormPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="moderation" element={<AdminModerationPage />} />
        <Route path="notes" element={<AdminNotesPage />} />
      </Route>
    </Routes>
  );
}

export default AdminSectionRoutes;
