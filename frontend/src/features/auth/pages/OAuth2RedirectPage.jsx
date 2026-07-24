import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';

function OAuth2RedirectPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        // 백엔드가 토큰을 URL fragment(#token=...)로 보내므로 hash에서 파싱한다
        const hash = window.location.hash.replace(/^#/, '');
        const params = new URLSearchParams(hash);
        const accessToken = params.get('token');

        if (!accessToken) {
            alert('로그인 토큰을 받지 못했습니다.');
            navigate('/login', { replace: true });
            return;
        }

        // AuthContext는 accessToken 외에 userId/nickname/role도 함께 저장하므로,
        // 토큰만으로는 로그인 상태가 완성되지 않는다 -> /me를 호출해 나머지 정보를 채운다.
        apiGet('/api/users/me', {}, { token: accessToken })
            .then((user) => {
                login({
                    accessToken,
                    userId: user.id,
                    nickname: user.nickname,
                    role: user.role,
                });
                navigate('/main', { replace: true });
            })
            .catch(() => {
                alert('로그인 처리에 실패했습니다.');
                navigate('/login', { replace: true });
            });
    }, [navigate, login]);

    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <p>로그인 처리 중입니다...</p>
        </div>
    );
}

export default OAuth2RedirectPage;