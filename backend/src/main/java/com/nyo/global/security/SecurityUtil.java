package com.nyo.global.security;

import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtil {

    private SecurityUtil() {
    }

    /**
     * 💡 JwtAuthenticationFilter가 인증 성공 시 principal 자리에 userId(Long)를 넣어뒀기 때문에
     * 여기서 그대로 꺼내 쓸 수 있어요. (구글 로그인 콜백 시점의 principal은 CustomOAuth2User라
     * 타입이 다르지만, 그건 최초 로그인 순간 한정이고 이후 API 호출은 전부 JWT로 오기 때문에
     * 이 메서드는 일반 API 컨트롤러에서만 사용합니다.)
     */
    public static Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof Long userId) {
            return userId;
        }
        // CHECK: 인증은 됐는데 principal 타입이 예상과 다른 경우 (설정 실수 등) 방어 코드
        throw new IllegalStateException("인증 정보에서 사용자 ID를 확인할 수 없습니다.");
    }
}