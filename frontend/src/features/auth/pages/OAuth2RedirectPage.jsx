import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';

// 구글 OAuth 로그인 완료 후 백엔드가 리다이렉트시키는 콜백 페이지.
// 성공/실패 모두 쿼리스트링·해시로 결과를 받아 처리한 뒤 최종 목적지로 이동시킨다.
function OAuth2RedirectPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    // StrictMode(개발 모드)에서 useEffect가 두 번 실행되어 토큰 처리가 중복되는 것을 막기 위한 가드
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        // 로그인 실패 시 백엔드(OAuth2FailureHandler)가 실패 사유를 쿼리 파라미터(?error=...)로 보낸다
        const errorMessage = new URLSearchParams(window.location.search).get('error');
        if (errorMessage) {
            alert(errorMessage);
            navigate('/login', { replace: true });
            return;
        }

        // 성공 시에는 토큰을 URL fragment(#token=...)로 보내므로 hash에서 파싱한다
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
                navigate(user.role === 'ADMIN' ? '/admin' : '/main', { replace: true });
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