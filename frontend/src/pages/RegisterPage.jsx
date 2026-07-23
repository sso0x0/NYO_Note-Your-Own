import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpUser, checkLoginId, checkEmail, checkNickname } from '../api/userApi';
import FormField from '../components/FormField';
import { validateLoginId, validatePassword, validateName, validateNickname, validateEmail } from '../utils/validators';

const VALIDATORS = {
    loginId: validateLoginId,
    password: validatePassword,
    name: validateName,
    nickname: validateNickname,
    email: validateEmail,
};

// 서버 중복 체크 대상 필드만 등록 (password/name은 check-* API가 없음)
const DUPLICATE_CHECKS = {
    loginId: { check: checkLoginId, message: '이미 사용 중인 아이디입니다.' },
    email: { check: checkEmail, message: '이미 사용 중인 이메일입니다.' },
    nickname: { check: checkNickname, message: '이미 사용 중인 닉네임입니다.' },
};

function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        loginId: '',
        password: '',
        name: '',
        nickname: '',
        email: ''
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [checking, setChecking] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // 중복 체크 응답이 늦게 도착했을 때, 그 사이 사용자가 값을 더 바꿔놨다면 그 결과는 이미 낡은 것이므로 버린다.
    const latestValues = useRef(formData);

    const handleChange = (e) => {
        const { name, value } = e.target;
        latestValues.current = { ...latestValues.current, [name]: value };
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (touched[name]) {
            const validate = VALIDATORS[name];
            setErrors((prev) => ({ ...prev, [name]: validate(value) }));
        }
    };

    const runDuplicateCheck = async (name, value) => {
        const entry = DUPLICATE_CHECKS[name];
        if (!entry) return;

        setChecking((prev) => ({ ...prev, [name]: true }));
        try {
            const isDuplicate = await entry.check(value);
            if (latestValues.current[name] !== value) return; // 응답 도착 전에 값이 바뀌었으면 무시
            setErrors((prev) => ({ ...prev, [name]: isDuplicate ? entry.message : '' }));
        } catch {
            // 중복 체크 API 실패는 가입 자체를 막지 않는다. 최종 검증은 어차피 제출 시 서버가 다시 한다.
        } finally {
            if (latestValues.current[name] === value) {
                setChecking((prev) => ({ ...prev, [name]: false }));
            }
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        const validate = VALIDATORS[name];
        const formatError = validate(value);
        setErrors((prev) => ({ ...prev, [name]: formatError }));

        if (!formatError) {
            runDuplicateCheck(name, value);
        }
    };

    const validateAll = () => {
        const newErrors = {};
        Object.keys(VALIDATORS).forEach((key) => {
            newErrors[key] = VALIDATORS[key](formData[key]);
        });
        setErrors(newErrors);
        setTouched({ loginId: true, password: true, name: true, nickname: true, email: true });
        return Object.values(newErrors).every((msg) => !msg);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!validateAll()) return;

        setSubmitting(true);
        try {
            await signUpUser(formData);
            alert('회원가입 성공! 로그인해주세요.');
            navigate('/login');
        } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message;

            if (status === 409) {
                if (message.includes('아이디') || message.toLowerCase().includes('loginid')) {
                    setErrors((prev) => ({ ...prev, loginId: message }));
                } else if (message.includes('이메일') || message.toLowerCase().includes('email')) {
                    setErrors((prev) => ({ ...prev, email: message }));
                } else if (message.includes('닉네임') || message.toLowerCase().includes('nickname')) {
                    setErrors((prev) => ({ ...prev, nickname: message }));
                } else {
                    setSubmitError(message);
                }
            } else {
                setSubmitError(message || '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2>회원가입</h2>
            <form
                onSubmit={handleSubmit}
                noValidate
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '320px' }}
            >
                <FormField
                    label="아이디"
                    name="loginId"
                    value={formData.loginId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.loginId ? errors.loginId : ''}
                    hint={checking.loginId ? '중복 확인 중...' : ''}
                    placeholder="영문, 숫자, 밑줄 4~20자"
                />
                <FormField
                    label="비밀번호"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password ? errors.password : ''}
                    placeholder="영문+숫자 포함 8자 이상"
                />
                <FormField
                    label="이름"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.name ? errors.name : ''}
                    placeholder="이름"
                />
                <FormField
                    label="닉네임"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.nickname ? errors.nickname : ''}
                    hint={checking.nickname ? '중복 확인 중...' : ''}
                    placeholder="2~12자"
                />
                <FormField
                    label="이메일"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email ? errors.email : ''}
                    hint={checking.email ? '중복 확인 중...' : ''}
                    placeholder="example@email.com"
                />

                {submitError && (
                    <div
                        style={{
                            fontSize: '13px',
                            color: '#e05252',
                            background: 'rgba(224, 82, 82, 0.1)',
                            border: '1px solid rgba(224, 82, 82, 0.3)',
                            borderRadius: '6px',
                            padding: '8px 10px',
                        }}
                    >
                        {submitError}
                    </div>
                )}

                <button type="submit" disabled={submitting} style={{ padding: '10px', cursor: submitting ? 'default' : 'pointer' }}>
                    {submitting ? '가입 중...' : '가입하기'}
                </button>
            </form>
        </div>
    );
}

export default RegisterPage;