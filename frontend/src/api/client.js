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
  if (!res.ok) {
    throw new Error(`요청 실패 (${res.status}): ${url.pathname}${url.search}`);
  }
  const payload = await res.json();

  // ApiResponse 형식({ success, data, message })은 실제 data만 반환한다.
  // 카테고리처럼 배열/객체를 직접 반환하는 기존 API 응답은 원형 그대로 유지한다.
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    if (payload.success === false) {
      throw new Error(payload.message || `요청 실패: ${url.pathname}`);
    }
    return payload.data;
  }

  return payload;
}

// UserController 등은 { success, data, message } 형태의 ApiResponse로 응답한다.
export async function apiPost(path, body = {}, { token } = {}) {
  const url = new URL(path, BASE_URL);
  const headers = { 'Content-Type': 'application/json' };
  const authToken = token ?? getStoredToken();
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.message || `요청 실패 (${res.status}): ${url.pathname}`);
  }

  return payload?.data;
}
