import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ProtectedRoute 안에 중첩되어 로그인은 이미 보장된 상태 — 여기서는 role만 확인한다.
// 백엔드도 "/api/admin/**"을 hasRole("ADMIN")으로 막고 있어 이중으로 보호된다.
function AdminRoute() {
  const { auth } = useAuth();

  if (auth?.role !== 'ADMIN') {
    return <Navigate to="/main" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
