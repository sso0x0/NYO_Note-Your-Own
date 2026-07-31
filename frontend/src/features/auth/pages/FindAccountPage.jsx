import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { findLoginId, sendPasswordResetCode, verifyPasswordResetCode, resetPassword } from '../api/auth';
import nyoLogo from '../../../assets/images/nyo_logo.png';

import './AuthPage.css';

// 아이디 찾기 / 비밀번호 찾기 페이지. 탭으로 두 폼(FindIdForm, ResetPasswordForm)을 전환한다.
function FindAccountPage() {
    const [activeTab, setActiveTab] = useState('id'); // 'id' | 'password'

    return (
        <div className="auth-page">
            <div className="auth-page__card">
                <Link to="/" className="auth-page__logo">
                    <img src={nyoLogo} alt="NYO" />
                </Link>
                <h1>아이디 / 비밀번호 찾기</h1>
                <p className="auth-page__subtitle">가입 시 등록한 정보로 아이디를 찾거나 비밀번호를 재설정할 수 있어요.</p>

                <div className="auth-page__tabs">
                    <button
                        type="button"
                        className={`auth-page__tab ${activeTab === 'id' ? 'is-active' : ''}`}
                        onClick={() => setActiveTab('id')}
                    >
                        아이디 찾기
                    </button>
                    <button
                        type="button"
                        className={`auth-page__tab ${activeTab === 'password' ? 'is-active' : ''}`}
                        onClick={() => setActiveTab('password')}
                    >
                        비밀번호 찾기
                    </button>
                </div>

                {activeTab === 'id' ? <FindIdForm /> : <ResetPasswordForm />}

                <p className="auth-page__switch">
                    <Link to="/login">로그인으로 돌아가기</Link>
                </p>
            </div>
        </div>
    );
}

// 이름+이메일 입력 -> 마스킹된 아이디를 조회해서 보여주는 폼
function FindIdForm() {
    const [form, setForm] = useState({ name: '', email: '' });
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setResult(null);

        setSubmitting(true);
        try {
            const response = await findLoginId(form);
            setResult(response.maskedLoginId);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="auth-page__form" onSubmit={handleSubmit} noValidate>
            {error && <p className="auth-page__error" role="alert">{error}</p>}
            {result && (
                <p className="auth-page__success">
                    회원님의 아이디는 <strong>{result}</strong> 입니다.
                </p>
            )}

            <div className="auth-page__field">
                <label htmlFor="find-id-name">이름</label>
                <input
                    id="find-id-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                />
            </div>

            <div className="auth-page__field">
                <label htmlFor="find-id-email">이메일</label>
                <input
                    id="find-id-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                />
            </div>

            <button type="submit" className="auth-page__submit" disabled={submitting}>
                {submitting ? '조회 중...' : '아이디 찾기'}
            </button>
        </form>
    );
}

// 비밀번호 input의 type을 토글하는 눈 아이콘 버튼 (보이기/숨기기 공용 컴포넌트)
function PasswordToggleButton({ visible, onToggle }) {
    return (
        <button
            type="button"
            className="auth-page__eye-btn"
            onClick={onToggle}
            aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
        >
            {visible ? (
                // 눈 감김 아이콘 (현재 보이는 상태 -> 누르면 숨김)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
            ) : (
                // 눈 뜬 아이콘 (현재 숨김 상태 -> 누르면 보임)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            )}
        </button>
    );
}

// 비밀번호 재설정 폼. 아이디+휴대폰 확인 -> SMS 인증코드 발송 -> 코드 확인 -> 새 비밀번호 제출, 3단계로 진행된다.
function ResetPasswordForm() {
    const navigate = useNavigate();
    // 인증코드 발송 여부에 따라 코드/새 비밀번호 입력란을 보여줄지 결정
    const [codeSent, setCodeSent] = useState(false);
    const [form, setForm] = useState({ loginId: '', phone: '', code: '', newPassword: '', confirmPassword: '' });
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);
    const [sendingCode, setSendingCode] = useState(false);
    const [resetting, setResetting] = useState(false);
    // 인증코드 사전 확인(verify-code) 통과 여부. true여야 최종 제출이 가능하다.
    const [codeVerified, setCodeVerified] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // 1단계: 아이디+휴대폰 번호로 SMS 인증코드 발송 요청
    const handleSendCode = async () => {
        setError(null);
        setInfo(null);

        if (!form.loginId.trim() || !form.phone.trim()) {
            setError('아이디와 휴대폰 번호를 모두 입력해 주세요.');
            return;
        }

        setSendingCode(true);
        try {
            await sendPasswordResetCode({ loginId: form.loginId, phone: form.phone });
            setCodeSent(true);
            setInfo('인증코드를 문자로 보냈어요. 5분 이내에 입력해 주세요.');
        } catch (err) {
            setError(err.message);
        } finally {
            setSendingCode(false);
        }
    };

    // 2단계: 발송된 인증코드가 맞는지 최종 제출 전에 미리 확인
    const handleVerifyCode = async () => {
        setError(null);
        setInfo(null);

        if (!form.code.trim()) {
            setError('인증코드를 입력해 주세요.');
            return;
        }

        setVerifying(true);
        try {
            await verifyPasswordResetCode({ loginId: form.loginId, phone: form.phone, code: form.code });
            setCodeVerified(true);
            setInfo('인증코드가 확인되었습니다.');
        } catch (err) {
            setError(err.message);
        } finally {
            setVerifying(false);
        }
    };

    // 3단계: 인증 완료 후 새 비밀번호로 최종 교체
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setInfo(null);

        if (!codeVerified) {
            setError('인증코드 확인을 먼저 완료해 주세요.');
            return;
        }
        if (!form.code.trim()) {
            setError('인증코드를 입력해 주세요.');
            return;
        }
        if (form.newPassword.length < 8 || form.newPassword.length > 72) {
            setError('새 비밀번호는 8자 이상 72자 이하로 입력해 주세요.');
            return;
        }
        if (form.newPassword !== form.confirmPassword) {
            setError('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        setResetting(true);
        try {
            await resetPassword({
                loginId: form.loginId,
                phone: form.phone,
                code: form.code,
                newPassword: form.newPassword,
            });
            navigate('/login', { replace: true, state: { justResetPassword: true } });
        } catch (err) {
            setError(err.message);
        } finally {
            setResetting(false);
        }
    };

    return (
        <form className="auth-page__form" onSubmit={handleSubmit} noValidate>
            {error && <p className="auth-page__error" role="alert">{error}</p>}
            {info && <p className="auth-page__success">{info}</p>}

            <div className="auth-page__field">
                <label htmlFor="reset-login-id">아이디</label>
                <input
                    id="reset-login-id"
                    name="loginId"
                    type="text"
                    autoComplete="username"
                    value={form.loginId}
                    onChange={handleChange}
                    disabled={codeSent}
                />
            </div>

            <div className="auth-page__field">
                <label htmlFor="reset-phone">휴대폰 번호</label>
                <div className="auth-page__code-row">
                    <input
                        id="reset-phone"
                        name="phone"
                        type="tel"
                        placeholder="010-1234-5678"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={handleChange}
                        disabled={codeSent}
                    />
                    <button
                        type="button"
                        className="auth-page__code-btn"
                        onClick={handleSendCode}
                        disabled={sendingCode}
                    >
                        {sendingCode ? '발송 중...' : codeSent ? '재발송' : '인증코드 받기'}
                    </button>
                </div>
            </div>

            {codeSent && (
                <>
                    <div className="auth-page__field">
                        <label htmlFor="reset-code">인증코드</label>
                        <div className="auth-page__code-row">
                            <input
                                id="reset-code"
                                name="code"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={form.code}
                                onChange={(e) => {
                                    handleChange(e);
                                    setCodeVerified(false); // 코드를 다시 수정하면 인증 상태 초기화
                                }}
                                disabled={codeVerified}
                            />
                            <button
                                type="button"
                                className="auth-page__code-btn"
                                onClick={handleVerifyCode}
                                disabled={verifying || codeVerified}
                            >
                                {verifying ? '확인 중...' : codeVerified ? '확인됨' : '인증확인'}
                            </button>
                        </div>
                    </div>

                    <div className="auth-page__field">
                        <label htmlFor="reset-new-password">새 비밀번호</label>
                        <div className="auth-page__password-row">
                            <input
                                id="reset-new-password"
                                name="newPassword"
                                type={showNewPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={form.newPassword}
                                onChange={handleChange}
                            />
                            <PasswordToggleButton
                                visible={showNewPassword}
                                onToggle={() => setShowNewPassword((prev) => !prev)}
                            />
                        </div>
                    </div>

                    <div className="auth-page__field">
                        <label htmlFor="reset-confirm-password">새 비밀번호 확인</label>
                        <div className="auth-page__password-row">
                            <input
                                id="reset-confirm-password"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={form.confirmPassword}
                                onChange={handleChange}
                            />
                            <PasswordToggleButton
                                visible={showConfirmPassword}
                                onToggle={() => setShowConfirmPassword((prev) => !prev)}
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-page__submit" disabled={resetting}>
                        {resetting ? '변경 중...' : '비밀번호 재설정'}
                    </button>
                </>
            )}
        </form>
    );
}

export default FindAccountPage;
