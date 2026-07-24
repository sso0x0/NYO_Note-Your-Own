// 브라우저에 저장된 JWT의 payload(exp)만 확인하기 위한 유틸. 서명 검증은 하지 않는다 —
// 그건 어차피 서버가 매 요청마다 하고 있고, 여기서는 "만료됐는지"만 미리 걸러내는 용도.
export const isTokenExpired = (token) => {
    if (!token) return true;

    const payload = token.split('.')[1];
    if (!payload) return true;

    try {
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join('')
        );
        const { exp } = JSON.parse(json);
        if (!exp) return true;

        return Date.now() >= exp * 1000;
    } catch {
        return true;
    }
};
