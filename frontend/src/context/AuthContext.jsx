import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiPost } from '../api/client';

const AuthContext = createContext(null);
const STORAGE_KEY = 'nyo_auth';

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadStoredAuth);
  const warningCheckedTokenRef = useRef(null);

  useEffect(() => {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [auth]);

  useEffect(() => {
    if (!auth?.accessToken || warningCheckedTokenRef.current === auth.accessToken) return;
    warningCheckedTokenRef.current = auth.accessToken;

    // 일반/구글 로그인 직후 미확인 경고를 확인 처리하고 제재 사유를 최초 한 번만 알립니다.
    apiPost('/api/users/me/warnings/latest/acknowledge', {}, { token: auth.accessToken })
      .then((warning) => {
        if (warning) {
          window.alert(`경고 제재 사유\n${warning.reason}`);
        }
      })
      .catch(() => {
        // 부가 알림 조회 실패가 정상 로그인과 화면 진입을 막지 않게 합니다.
        warningCheckedTokenRef.current = null;
      });
  }, [auth?.accessToken]);

  const value = useMemo(
    () => ({
      auth,
      isAuthenticated: !!auth,
      login: (loginResponse) =>
        setAuth({
          accessToken: loginResponse.accessToken,
          userId: loginResponse.userId,
          nickname: loginResponse.nickname,
          role: loginResponse.role,
        }),
      // localStorage 정리를 auth 변경 useEffect에만 맡기면, 로그아웃 직후 즉시
      // 페이지를 이동시키는 호출부에서 그 effect가 아직 실행되기 전에 새 페이지가
      // 뜰 수 있다(레이스) -> logout() 시점에 동기적으로 지워서 그런 타이밍 문제를 없앤다.
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setAuth(null);
      },
      // 마이페이지에서 닉네임 등을 수정한 뒤 헤더 표시를 즉시 갱신하기 위한 부분 갱신.
      updateNickname: (nickname) => setAuth((prev) => (prev ? { ...prev, nickname } : prev)),
    }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Provider와 훅을 한 파일에 두면 Fast Refresh가 이 파일 전체를 리로드한다는 경고가 뜨지만,
// 19곳에서 참조하는 useAuth를 별도 파일로 쪼개는 건 이 정리 작업 범위를 넘어서라 경고만 끈다.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return ctx;
}
