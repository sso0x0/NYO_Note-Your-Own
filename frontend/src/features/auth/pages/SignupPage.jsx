import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../api/auth';
import nyoLogo from '../../../assets/images/nyo_logo.png';
import './AuthPage.css';

function EyeIcon({ open }) {
  return open ? (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
  ) : (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.58 10.58a3 3 0 1 0 4.24 4.24" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.1 6.1C3.4 7.9 1 12 1 12s4 7 11 7c2.05 0 3.83-.55 5.32-1.35M17.9 17.9C20.6 16.1 23 12 23 12s-1.6-2.8-4.32-4.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
  );
}

const INITIAL_FORM = {
  loginId: '',
  password: '',
  passwordConfirm: '',
  name: '',
  nickname: '',
  email: '',
  phone: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^01[0-9]-?\d{3,4}-?\d{4}$/;

// 필드별 실시간 검증 규칙. 두 번째 인자(form)는 비밀번호 확인처럼 다른 필드값이
// 필요한 경우에 사용합니다.
const validators = {
  loginId: (value) => {
    if (!value.trim()) return '아이디를 입력해 주세요.';
    if (value.length < 4 || value.length > 50) return '아이디는 4자 이상 입력해 주세요.';
    return '';
  },
  password: (value) => {
    if (!value) return '비밀번호를 입력해 주세요.';
    if (value.length < 8 || value.length > 72) return '비밀번호는 8자 이상 입력해 주세요.';
    return '';
  },
  passwordConfirm: (value, form) => {
    if (!value) return '비밀번호 확인을 입력해 주세요.';
    if (value !== form.password) return '비밀번호가 일치하지 않습니다.';
    return '';
  },
  name: (value) => {
    if (!value.trim()) return '이름을 입력해 주세요.';
    return '';
  },
  nickname: (value) => {
    if (!value.trim()) return '닉네임을 입력해 주세요.';
    return '';
  },
  email: (value) => {
    if (!value.trim()) return '이메일을 입력해 주세요.';
    if (!EMAIL_PATTERN.test(value)) return '올바른 이메일 형식이 아닙니다.';
    return '';
  },
  phone: (value) => {
    if (!value) return ''; // 선택 항목
    if (!PHONE_PATTERN.test(value)) return '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)';
    return '';
  },
};

function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const runValidator = (name, nextForm) => validators[name](nextForm[name], nextForm);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);

    // 이미 건드린 필드는 입력할 때마다 즉시 재검사합니다.
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (touched[name]) next[name] = runValidator(name, nextForm);
      // 비밀번호를 바꾸면 이미 입력해둔 비밀번호 확인도 다시 검사해야
      // "일치하지 않습니다" 문구가 실시간으로 갱신됩니다.
      if (name === 'password' && touched.passwordConfirm) {
        next.passwordConfirm = runValidator('passwordConfirm', nextForm);
      }
      return next;
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({ ...prev, [name]: runValidator(name, form) }));
  };

  const validateAll = () => {
    const nextErrors = {};
    Object.keys(validators).forEach((name) => {
      nextErrors[name] = runValidator(name, form);
    });
    setFieldErrors(nextErrors);
    setTouched(Object.fromEntries(Object.keys(validators).map((name) => [name, true])));
    return Object.values(nextErrors).every((msg) => !msg);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateAll()) return;

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

          <form className="auth-page__form auth-page__form--signup" onSubmit={handleSubmit} noValidate>
            {error && <p className="auth-page__error" role="alert">{error}</p>}

            <div className="auth-page__group">
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
                    onBlur={handleBlur}
                    className={fieldErrors.loginId ? 'is-invalid' : ''}
                    aria-invalid={!!fieldErrors.loginId}
                />
                {fieldErrors.loginId && <p className="auth-page__field-error">{fieldErrors.loginId}</p>}
              </div>

              <div className="auth-page__field">
                <label htmlFor="password">비밀번호</label>
                <div className="auth-page__password-wrap">
                  <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={72}
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
                {fieldErrors.password && <p className="auth-page__field-error">{fieldErrors.password}</p>}
              </div>

              <div className="auth-page__field">
                <label htmlFor="passwordConfirm">비밀번호 확인</label>
                <div className="auth-page__password-wrap">
                  <input
                      id="passwordConfirm"
                      name="passwordConfirm"
                      type={showPasswordConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.passwordConfirm}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={fieldErrors.passwordConfirm ? 'is-invalid' : ''}
                      aria-invalid={!!fieldErrors.passwordConfirm}
                  />
                  <button
                      type="button"
                      className="auth-page__password-toggle"
                      onClick={() => setShowPasswordConfirm((v) => !v)}
                      aria-label={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                      aria-pressed={showPasswordConfirm}
                      tabIndex={-1}
                  >
                    <EyeIcon open={showPasswordConfirm} />
                  </button>
                </div>
                {fieldErrors.passwordConfirm && <p className="auth-page__field-error">{fieldErrors.passwordConfirm}</p>}
              </div>
            </div>

            <div className="auth-page__group">
              <div className="auth-page__field">
                <label htmlFor="name">이름</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={fieldErrors.name ? 'is-invalid' : ''}
                    aria-invalid={!!fieldErrors.name}
                />
                {fieldErrors.name && <p className="auth-page__field-error">{fieldErrors.name}</p>}
              </div>

              <div className="auth-page__field">
                <label htmlFor="nickname">닉네임</label>
                <input
                    id="nickname"
                    name="nickname"
                    type="text"
                    value={form.nickname}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={fieldErrors.nickname ? 'is-invalid' : ''}
                    aria-invalid={!!fieldErrors.nickname}
                />
                {fieldErrors.nickname && <p className="auth-page__field-error">{fieldErrors.nickname}</p>}
              </div>
            </div>

            <div className="auth-page__group">
              <div className="auth-page__field">
                <label htmlFor="email">이메일</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={fieldErrors.email ? 'is-invalid' : ''}
                    aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && <p className="auth-page__field-error">{fieldErrors.email}</p>}
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
                    onBlur={handleBlur}
                    className={fieldErrors.phone ? 'is-invalid' : ''}
                    aria-invalid={!!fieldErrors.phone}
                />
                {fieldErrors.phone && <p className="auth-page__field-error">{fieldErrors.phone}</p>}
              </div>
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