import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login as loginRequest } from '../api/auth';
import { useAuth } from '../../../context/AuthContext';
import nyoLogo from '../../../assets/images/nyo_logo.png';

import './AuthPage.css';

function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({ loginId: '', password: '' });
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const response = await loginRequest(form);
            login(response);
            const redirectTo = location.state?.from?.pathname || '/main';
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    };

    return (
        <div className="auth-page">
            <div className="auth-page__card">
                <Link to="/" className="auth-page__logo">
                    <img src={nyoLogo} alt="NYO" />
                </Link>
                <h1>다시 만나서 반가워요</h1>
                <p className="auth-page__subtitle">로그인하고 나만의 강의 노트를 이어서 정리해보세요.</p>

                <form className="auth-page__form" onSubmit={handleSubmit}>
                    {!error && location.state?.justSignedUp && (
                        <p className="auth-page__success">회원가입이 완료되었습니다. 로그인해주세요.</p>
                    )}
                    {error && <p className="auth-page__error" role="alert">{error}</p>}

                    <div className="auth-page__field">
                        <label htmlFor="loginId">아이디</label>
                        <input
                            id="loginId"
                            name="loginId"
                            type="text"
                            autoComplete="username"
                            value={form.loginId}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="auth-page__field">
                        <label htmlFor="password">비밀번호</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-page__submit" disabled={submitting}>
                        {submitting ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                {/* 수정된 구분선 */}
                <div className="auth-page__divider">
                    <span>또는</span>
                </div>

                {/* 수정된 구글 로그인 버튼 */}
                <button
                    type="button"
                    className="auth-page__google"
                    onClick={handleGoogleLogin}
                >
                    <svg viewBox="0 0 48 48" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <span>구글로 로그인</span>
                </button>

                <p className="auth-page__switch">
                    아직 계정이 없으신가요? <Link to="/signup">회원가입</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;