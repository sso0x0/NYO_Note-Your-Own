package com.nyo.global.security;

import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

/**
 * 로그인 무차별 대입 방어용 인메모리 카운터.
 * 별도 인프라(Redis 등) 없이 단일 인스턴스 기준으로 loginId별 실패 횟수를 추적한다.
 * (다중 인스턴스로 확장 시에는 인스턴스별로 따로 카운트되므로 공유 저장소로 교체 필요)
 */
@Component
public class LoginAttemptGuard {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(10);

    // loginId를 key로 실패 횟수/윈도우 시작시각을 저장. UserService.login()에서만 호출됨
    private final ConcurrentHashMap<String, AtomicReference<Attempt>> attempts = new ConcurrentHashMap<>();

    // 로그인 시도 전 호출: 최근 WINDOW(10분) 내 실패가 MAX_ATTEMPTS(5회) 이상이면 잠금 예외를 던져 조회 자체를 막음
    public void checkAllowed(String loginId) {
        AtomicReference<Attempt> ref = attempts.get(loginId);
        if (ref == null) return;

        Attempt attempt = ref.get();
        if (attempt.count >= MAX_ATTEMPTS && attempt.windowStart.plus(WINDOW).isAfter(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.MEMBER_LOGIN_LOCKED);
        }
    }

    // 아이디 없음/비밀번호 불일치 시 호출: 윈도우가 지났으면 카운트를 리셋하고, 아니면 실패 횟수를 1 증가
    public void onFailure(String loginId) {
        attempts.computeIfAbsent(loginId, key -> new AtomicReference<>(new Attempt(0, LocalDateTime.now())))
                .updateAndGet(attempt -> {
                    LocalDateTime now = LocalDateTime.now();
                    boolean windowExpired = attempt.windowStart.plus(WINDOW).isBefore(now);
                    return windowExpired ? new Attempt(1, now) : new Attempt(attempt.count + 1, attempt.windowStart);
                });
    }

    // 로그인 성공 시 호출: 이전 실패 기록을 전부 삭제
    public void onSuccess(String loginId) {
        attempts.remove(loginId);
    }

    // 존재하지 않는 아이디로 실패를 쌓고 다시 조회되지 않는 항목은 onSuccess로 지워질 기회가 없어
    // 맵이 무한정 쌓일 수 있으므로, 윈도우가 지난 항목을 주기적으로 청소한다
    @Scheduled(fixedRate = 10 * 60 * 1000)
    public void evictExpiredEntries() {
        LocalDateTime now = LocalDateTime.now();
        attempts.entrySet().removeIf(entry -> entry.getValue().get().windowStart.plus(WINDOW).isBefore(now));
    }

    private record Attempt(int count, LocalDateTime windowStart) {
    }
}
