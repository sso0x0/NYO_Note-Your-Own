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

// 대부분의 API는 { success, data, message } 형태의 ApiResponse로 응답하지만,
// /api/categories처럼 배열을 그대로 내려주는 예외도 있어 언래핑 전에 모양을 확인한다.
function unwrap(payload) {
  if (Array.isArray(payload) || payload === null || typeof payload !== 'object') {
    return payload;
  }
  return 'data' in payload ? payload.data : payload;
}

export async function apiGet(path, params = {}) {
  const url = new URL(path, BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  const token = getStoredToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const res = await fetch(url, { credentials: 'include', headers });
  const payload = await res.json().catch(() => null);

  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.message || `요청 실패 (${res.status}): ${url.pathname}${url.search}`);
  }

  return unwrap(payload);
}

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

  const payload = await res.json().catch(() => null);

  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.message || `요청 실패 (${res.status}): ${url.pathname}`);
  }

  return unwrap(payload);
}

export function apiPost(path, body = {}, options = {}) {
  return sendJson('POST', path, body, options);
}

export function apiPatch(path, body = {}, options = {}) {
  return sendJson('PATCH', path, body, options);
}
