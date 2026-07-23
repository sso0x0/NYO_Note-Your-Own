import axiosClient from './axiosClient';

export const signUpUser = async (userData) => {
    const response = await axiosClient.post('/users/signup', userData);
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await axiosClient.post('/users/login', credentials);
    return response.data.data;
};

// 아래 세 함수는 회원가입 폼에서 필드 blur 시 실시간 중복 체크용.
// 응답 data는 boolean이며 true면 "이미 사용 중"이라는 뜻이다.
export const checkLoginId = async (loginId) => {
    const response = await axiosClient.get('/users/check-login-id', { params: { loginId } });
    return response.data.data;
};

export const checkEmail = async (email) => {
    const response = await axiosClient.get('/users/check-email', { params: { email } });
    return response.data.data;
};

export const checkNickname = async (nickname) => {
    const response = await axiosClient.get('/users/check-nickname', { params: { nickname } });
    return response.data.data;
};