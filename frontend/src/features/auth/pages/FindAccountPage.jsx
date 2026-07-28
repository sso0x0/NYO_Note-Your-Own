import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { findLoginId, sendPasswordResetCode, resetPassword } from '../api/auth';
import nyoLogo from '../../../assets/images/nyo_logo.png';

import './AuthPage.css';

function FindAccountPage() {
    const [activeTab, setActiveTab] = useState('id');

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

        if (!form.name.trim() || !form.email.trim()) {
            setError('이름과 이메일을 모두 입력해 주세요.');
            return;
        }

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

function ResetPasswordForm() {
    const navigate = useNavigate();
    const [codeSent, setCodeSent] = useState(false);
    const [form, setForm] = useState({ loginId: '', email: '', code: '', newPassword: '', confirmPassword: '' });
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);
    const [sendingCode, setSendingCode] = useState(false);
    const [resetting, setResetting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSendCode = async () => {
        setError(null);
        setInfo(null);

        if (!form.loginId.trim() || !form.email.trim()) {
            setError('아이디와 이메일을 모두 입력해 주세요.');
            return;
        }

        setSendingCode(true);
        try {
            await sendPasswordResetCode({ loginId: form.loginId, email: form.email });
            setCodeSent(true);
            setInfo('인증코드를 이메일로 보냈어요. 5분 이내에 입력해 주세요.');
        } catch (err) {
            setError(err.message);
        } finally {
            setSendingCode(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setInfo(null);

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
                email: form.email,
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
                <label htmlFor="reset-email">이메일</label>
                <div className="auth-page__code-row">
                    <input
                        id="reset-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
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
                        <input
                            id="reset-code"
                            name="code"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={form.code}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="auth-page__field">
                        <label htmlFor="reset-new-password">새 비밀번호</label>
                        <input
                            id="reset-new-password"
                            name="newPassword"
                            type="password"
                            autoComplete="new-password"
                            value={form.newPassword}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="auth-page__field">
                        <label htmlFor="reset-confirm-password">새 비밀번호 확인</label>
                        <input
                            id="reset-confirm-password"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                        />
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
