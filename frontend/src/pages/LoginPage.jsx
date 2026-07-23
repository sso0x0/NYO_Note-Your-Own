import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login as loginRequest } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import nyoLogo from '../assets/images/nyo_logo.png';

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

                <div className="auth-page__divider">
                    <span>또는</span>
                </div>

                <button
                    type="button"
                    className="auth-page__google"
                    onClick={handleGoogleLogin}
                >
                    구글로 로그인
                </button>

                <p className="auth-page__switch">
                    아직 계정이 없으신가요? <Link to="/signup">회원가입</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;