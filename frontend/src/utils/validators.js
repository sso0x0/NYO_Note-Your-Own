// 회원가입/로그인 폼에서 쓰는 입력값 검증 함수 모음(아이디/비밀번호/이름/닉네임/이메일).
export const validateLoginId = (value) => {
    if (!value.trim()) return '아이디를 입력해주세요.';
    if (value.length < 4 || value.length > 20) return '아이디는 4~20자로 입력해주세요.';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return '아이디는 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.';
    return '';
};

// 비밀번호 길이 및 영문+숫자 포함 여부를 검증한다.
export const validatePassword = (value) => {
    if (!value) return '비밀번호를 입력해주세요.';
    if (value.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(value)) return '비밀번호는 영문과 숫자를 포함해야 합니다.';
    return '';
};

// 이름 입력값이 비어있지 않고 최소 길이를 만족하는지 검증한다.
export const validateName = (value) => {
    if (!value.trim()) return '이름을 입력해주세요.';
    if (value.trim().length < 2) return '이름은 2자 이상이어야 합니다.';
    return '';
};

// 닉네임 길이가 허용 범위(2~12자)인지 검증한다.
export const validateNickname = (value) => {
    if (!value.trim()) return '닉네임을 입력해주세요.';
    if (value.trim().length < 2 || value.trim().length > 12) return '닉네임은 2~12자로 입력해주세요.';
    return '';
};

// 이메일 형식이 올바른지 정규식으로 검증한다.
export const validateEmail = (value) => {
    if (!value.trim()) return '이메일을 입력해주세요.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return '올바른 이메일 형식이 아닙니다.';
    return '';
};