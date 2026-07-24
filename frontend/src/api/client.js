const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// AuthContext가 로그인 시 이 키로 localStorage에 저장한다. fetch는 React 트리 밖에서
// 일어나므로 context 대신 여기서 직접 읽는다.
function getStoredToken() {
    try {
        const raw = localStorage.getItem('nyo_auth');
        return raw ? JSON.parse(raw)?.accessToken ?? null : null;
    } catch {
        return null;
    }
}

// 토큰을 실어 보냈는데도 401이 오면 "세션 만료/무효 토큰"으로 보고 로그인 화면으로 보낸다.
// 토큰 없이 보낸 요청의 401(예: 로그인 실패)은 여기 해당하지 않는다 — 그건 호출부가 메시지로 보여줘야 한다.
// AuthContext 밖에서 호출되므로 localStorage를 직접 건드린다.
function handleUnauthorized() {
    localStorage.removeItem('nyo_auth');
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
}

// Lecture 등 일부 컨트롤러는 { success, data, message } 형태의 ApiResponse로 응답하고,
// Category 등 아직 마이그레이션 전인 컨트롤러는 데이터(배열/객체)를 그대로 반환한다. 둘 다 지원.
function unwrap(payload) {
    if (Array.isArray(payload) || payload === null || typeof payload !== 'object') {
        return payload;
    }
    return 'success' in payload && 'data' in payload ? payload.data : payload;
}

export async function apiGet(path, params = {}, { token: tokenOverride } = {}) {
    const url = new URL(path, BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, value);
        }
    });

    const token = tokenOverride ?? getStoredToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    const res = await fetch(url, { credentials: 'include', headers });
    if (res.status === 401 && token) {
        handleUnauthorized();
    }
    const payload = await res.json().catch(() => null);

    if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || `요청 실패 (${res.status}): ${url.pathname}${url.search}`);
    }

    return unwrap(payload);
}

export async function apiDelete(path, { token } = {}) {
    const url = new URL(path, BASE_URL);
    const authToken = token ?? getStoredToken();
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;

    const res = await fetch(url, { method: 'DELETE', headers, credentials: 'include' });
    if (res.status === 401 && authToken) {
        handleUnauthorized();
    }
    const payload = await res.json().catch(() => null);

    if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || `요청 실패 (${res.status}): ${url.pathname}`);
    }

    // Note/Post 삭제 등은 응답 바디가 없어 payload가 null인 경우가 많다.
    return unwrap(payload);
}

// UserController 등은 { success, data, message } 형태의 ApiResponse로 응답한다.
// apiPost/apiPut/apiPatch가 body만 있고 method만 다르므로 공통 로직을 여기 하나로 모았다.
async function sendJson(method, path, body = {}, { token } = {}) {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    const authToken = token ?? getStoredToken();
    if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    const res = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(body),
    });

    if (res.status === 401 && authToken) {
        handleUnauthorized();
    }
    const payload = await res.json().catch(() => null);

    if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || `요청 실패 (${res.status}): ${url.pathname}`);
    }

    return unwrap(payload);
}

export function apiPost(path, body = {}, options = {}) {
    return sendJson('POST', path, body, options);
}

export function apiPut(path, body = {}, options = {}) {
    return sendJson('PUT', path, body, options);
}

// 뽀모도로 타이머 종료(PATCH)처럼 부분 수정 API에 사용. apiPost와 동작은 동일하고 method만 다르다.
export function apiPatch(path, body = {}, options = {}) {
    return sendJson('PATCH', path, body, options);
}