import { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

  useEffect(() => {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [auth]);

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
      logout: () => setAuth(null),
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
