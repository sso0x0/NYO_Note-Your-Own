import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function OAuth2RedirectPage() {
    const navigate = useNavigate();
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        // 백엔드가 토큰을 URL fragment(#token=...)로 보내므로 hash에서 파싱한다
        const hash = window.location.hash.replace(/^#/, '');
        const params = new URLSearchParams(hash);
        const accessToken = params.get('token');

        if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            navigate('/dashboard', { replace: true });
        } else {
            alert('로그인 토큰을 받지 못했습니다.');
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <p>로그인 처리 중입니다...</p>
        </div>
    );
}

export default OAuth2RedirectPage;