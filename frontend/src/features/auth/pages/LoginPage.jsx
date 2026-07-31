import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login as loginRequest } from '../api/auth';
import { useAuth } from '../../../context/AuthContext';
import nyoLogo from '../../../assets/images/nyo_logo.png';
import eyeOpenIcon from '../../../assets/images/eye.png';
import eyeCloseIcon from '../../../assets/images/eye_close.png';

import './AuthPage.css';

function EyeIcon({ open }) {
    return <img src={open ? eyeOpenIcon : eyeCloseIcon} alt="" width="20" height="20" />;
}

// 필드별 실시간 검증 규칙: 값이 바뀔 때마다 이 함수들로 즉시 재검사합니다.
const validators = {
    loginId: (value) => {
        if (!value.trim()) return '아이디를 입력해 주세요.';
        return '';
    },
    password: (value) => {
        if (!value) return '비밀번호를 입력해 주세요.';
        return '';
    },
};

// 로그인 페이지. 아이디/비밀번호 로그인과 구글 OAuth 로그인 진입점을 함께 제공한다.
function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({ loginId: '', password: '' });
    const [fieldErrors, setFieldErrors] = useState({});
    // 사용자가 한 번이라도 focus out(blur)한 필드만 기록 - 처음부터 모든 필드에 에러를 띄우지 않기 위함
    const [touched, setTouched] = useState({});
    // 로그인 실패 등 서버/네트워크 에러 메시지
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // 이미 한 번 건드린 필드는 입력할 때마다 바로바로 재검사합니다.
        if (touched[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: validators[name](value) }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        setFieldErrors((prev) => ({ ...prev, [name]: validators[name](value) }));
    };

    // 제출 직전 전체 필드를 한 번에 검증 (blur를 안 거친 필드도 강제로 touched 처리)
    const validateAll = () => {
        const nextErrors = {
            loginId: validators.loginId(form.loginId),
            password: validators.password(form.password),
        };
        setFieldErrors(nextErrors);
        setTouched({ loginId: true, password: true });
        return Object.values(nextErrors).every((msg) => !msg);
    };

    // 로그인 폼 제출: 검증 통과 시 로그인 API 호출 후 AuthContext에 세션 저장, 역할별로 이동
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!validateAll()) return;

        setSubmitting(true);
        try {
            const response = await loginRequest(form);
            login(response);
            // 이전에 보던 페이지(location.state.from)로 돌아가지 않고,
            // 역할에 따라 항상 메인/관리자 페이지로 고정 이동한다.
            navigate(response.role === 'ADMIN' ? '/admin' : '/main', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleLogin = () => {
        // 상대 경로로 보내야 ngrok 터널 접속 시에도 같은 origin을 유지하고
        // vite.config.js의 /oauth2/authorization 프록시를 통해 백엔드로 전달된다.
        window.location.href = '/oauth2/authorization/google';
    };

    return (
        <div className="auth-page">
            <div className="auth-page__card">
                <Link to="/" className="auth-page__logo">
                    <img src={nyoLogo} alt="NYO" />
                </Link>
                <h1>다시 만나서 반가워요</h1>
                <p className="auth-page__subtitle">로그인하고 나만의 강의 노트를 이어서 정리해보세요.</p>

                <form className="auth-page__form" onSubmit={handleSubmit} noValidate>
                    {!error && location.state?.justSignedUp && (
                        <p className="auth-page__success">회원가입이 완료되었습니다. 로그인해주세요.</p>
                    )}
                    {!error && location.state?.justResetPassword && (
                        <p className="auth-page__success">비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.</p>
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
                            onBlur={handleBlur}
                            className={fieldErrors.loginId ? 'is-invalid' : ''}
                            aria-invalid={!!fieldErrors.loginId}
                        />
                        {fieldErrors.loginId && (
                            <p className="auth-page__field-error">{fieldErrors.loginId}</p>
                        )}
                    </div>

                    <div className="auth-page__field">
                        <label htmlFor="password">비밀번호</label>
                        <div className="auth-page__password-wrap">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={form.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={fieldErrors.password ? 'is-invalid' : ''}
                                aria-invalid={!!fieldErrors.password}
                            />
                            <button
                                type="button"
                                className="auth-page__password-toggle"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                                aria-pressed={showPassword}
                                tabIndex={-1}
                            >
                                <EyeIcon open={showPassword} />
                            </button>
                        </div>
                        {fieldErrors.password && (
                            <p className="auth-page__field-error">{fieldErrors.password}</p>
                        )}
                    </div>

                    <button type="submit" className="auth-page__submit" disabled={submitting}>
                        {submitting ? '로그인 중...' : '로그인'}
                    </button>

                    <p className="auth-page__find-account">
                        <Link to="/find-account">아이디 · 비밀번호 찾기</Link>
                    </p>
                </form>

                <div className="auth-page__divider">
                    <span>또는</span>
                </div>

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