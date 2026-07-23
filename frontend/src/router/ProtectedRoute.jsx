import { Navigate } from 'react-router-dom';
import { isTokenExpired } from '../utils/jwt';

function ProtectedRoute({ children }) {
    const token = localStorage.getItem('accessToken');

    // 토큰이 없거나 만료 시 로그인 페이지로 redirect
    if (!token || isTokenExpired(token)) {
        localStorage.removeItem('accessToken');
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;