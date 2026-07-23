import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../api/auth';
import nyoLogo from '../../../assets/images/nyo_logo.png';
import './AuthPage.css';

const INITIAL_FORM = {
  loginId: '',
  password: '',
  passwordConfirm: '',
  name: '',
  nickname: '',
  email: '',
  phone: '',
};

function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setSubmitting(true);
    try {
      const { passwordConfirm, phone, ...rest } = form;
      await signup({ ...rest, phone: phone || undefined });
      navigate('/login', { replace: true, state: { justSignedUp: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <Link to="/" className="auth-page__logo">
          <img src={nyoLogo} alt="NYO" />
        </Link>
        <h1>NYO와 함께 시작해요</h1>
        <p className="auth-page__subtitle">가입은 1분이면 충분해요. 흩어진 강의 노트를 한 곳에 모아보세요.</p>

        <form className="auth-page__form" onSubmit={handleSubmit}>
          {error && <p className="auth-page__error" role="alert">{error}</p>}

          <div className="auth-page__field">
            <label htmlFor="loginId">아이디</label>
            <input
              id="loginId"
              name="loginId"
              type="text"
              autoComplete="username"
              minLength={4}
              maxLength={50}
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
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-page__field">
            <label htmlFor="passwordConfirm">비밀번호 확인</label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              value={form.passwordConfirm}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-page__field">
            <label htmlFor="name">이름</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-page__field">
            <label htmlFor="nickname">닉네임</label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              value={form.nickname}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-page__field">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-page__field">
            <label htmlFor="phone">전화번호 (선택)</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="010-1234-5678"
              autoComplete="tel"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="auth-page__submit" disabled={submitting}>
            {submitting ? '가입 처리 중...' : '회원가입'}
          </button>
        </form>

        <p className="auth-page__switch">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;
