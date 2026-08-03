// axios 인스턴스 및 요청/응답 인터셉터 설정: 요청마다 액세스 토큰을 자동으로 싣고, 401 응답 시 로그인 페이지로 보낸다.
import axios from 'axios';

const axiosClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청마다 저장된 액세스 토큰을 Authorization 헤더에 실어 보낸다.
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 401 응답을 받으면 토큰을 지우고 로그인 페이지로 이동시킨다.
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosClient;