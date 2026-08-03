import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login as loginRequest } from '../api/auth';
import { useAuth } from '../../../context/AuthContext';
import nyoLogo from '../../../assets/images/nyo_logo.png';
import eyeOpenIcon from '../../../assets/images/eye.png';
import eyeCloseIcon from '../../../assets/images/eye_close.png';

import './AuthPage.css';

// 로그인 페이지. 아이디/비밀번호 폼 로그인과 구글 OAuth 로그인을 함께 제공한다.
const WITHDRAWN_MESSAGE = '이미 탈퇴한 회원입니다.';

// 비밀번호 표시/숨김 상태에 따라 눈 아이콘 이미지를 바꿔 보여준다.
function EyeIcon({ open }) {
    return <img src={open ? eyeOpenIcon : eyeCloseIcon} alt="" width="20" height="20" />;
}

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

// 로그인 페이지. 아이디/비밀번호 폼 로그인과 구글 OAuth 로그인을 함께 제공한다.
function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({ loginId: '', password: '' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // OAuth2RedirectPage에서 넘어온 에러 처리
    useEffect(() => {
        if (location.state?.oauthError) {
            setError(location.state.oauthError);

            // 새로고침 시 에러 메시지가 계속 남아있는 것을 방지하기 위해 state에서 oauthError를 지움
            const newState = { ...location.state };
            delete newState.oauthError;
            navigate(location.pathname, { state: newState, replace: true });
        }
    }, [location, navigate]);

    // 입력 필드 값을 폼 상태에 반영하고, 이미 blur된 필드는 즉시 재검증한다.
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (touched[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: validators[name](value) }));
        }
    };

    // 필드에서 포커스가 벗어나면 해당 필드를 touched로 표시하고 검증한다.
    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        setFieldErrors((prev) => ({ ...prev, [name]: validators[name](value) }));
    };

    // 제출 전 아이디/비밀번호를 한 번에 검증하고 통과 여부를 반환한다.
    const validateAll = () => {
        const nextErrors = {
            loginId: validators.loginId(form.loginId),
            password: validators.password(form.password),
        };
        setFieldErrors(nextErrors);
        setTouched({ loginId: true, password: true });
        return Object.values(nextErrors).every((msg) => !msg);
    };

    // 전체 검증 통과 시 로그인 요청을 보내고, 성공하면 역할에 맞는 화면으로 이동한다.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!validateAll()) return;

        setSubmitting(true);
        try {
            const response = await loginRequest(form);
            login(response);
            navigate(response.role === 'ADMIN' ? '/admin' : '/main', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // 구글 OAuth 로그인 플로우 시작을 위해 백엔드 인증 엔드포인트로 이동한다.
    const handleGoogleLogin = () => {
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

                    {/* 일반 폼 로그인, 구글 OAuth 로그인 공통 탈퇴 회원 UI */}
                    {error && (
                        error === WITHDRAWN_MESSAGE ? (
                            <div className="auth-page__error" role="alert">
                                <p>탈퇴한 계정입니다. 다시 가입하시겠습니까?</p>
                                <button
                                    type="button"
                                    className="auth-page__link-btn"
                                    onClick={() => navigate('/signup')}
                                    style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', padding: 0, marginTop: '5px' }}
                                >
                                    회원가입 하러 가기
                                </button>
                            </div>
                        ) : (
                            <p className="auth-page__error" role="alert">{error}</p>
                        )
                    )}

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