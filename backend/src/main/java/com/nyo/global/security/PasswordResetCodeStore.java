package com.nyo.global.security;

import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 비밀번호 재설정용 이메일 인증코드를 저장하는 인메모리 저장소.
 * LoginAttemptGuard와 동일하게 별도 인프라(Redis 등) 없이 단일 인스턴스 기준으로 동작한다.
 * (다중 인스턴스로 확장 시에는 인스턴스별로 따로 저장되므로 공유 저장소로 교체 필요)
 */
@Component
public class PasswordResetCodeStore {

    private static final Duration TTL = Duration.ofMinutes(5);
    private static final int MAX_VERIFY_ATTEMPTS = 5;

    // loginId를 key로 발급된 코드/만료시각/틀린 시도 횟수를 저장
    private final ConcurrentHashMap<String, CodeEntry> codes = new ConcurrentHashMap<>();

    // 인증코드 발송 시 호출: 새 코드로 덮어써서 이전 코드는 즉시 무효화
    public void save(String loginId, String code) {
        codes.put(loginId, new CodeEntry(code, LocalDateTime.now().plus(TTL), 0));
    }

    // 비밀번호 재설정 시 호출: 코드가 맞으면 정상 반환하고 즉시 소모(재사용 방지), 틀리면 예외 + 시도 횟수 증가
    public void verify(String loginId, String code) {
        CodeEntry entry = codes.get(loginId);
        if (entry == null || entry.isExpired() || entry.attempts >= MAX_VERIFY_ATTEMPTS) {
            codes.remove(loginId);
            throw new BusinessException(ErrorCode.PASSWORD_RESET_CODE_INVALID);
        }

        if (!entry.code.equals(code)) {
            codes.put(loginId, entry.withAttemptIncremented());
            throw new BusinessException(ErrorCode.PASSWORD_RESET_CODE_INVALID);
        }

        codes.remove(loginId);
    }

    // 재설정을 끝까지 완료하지 않고 이탈한 항목이 계속 쌓이지 않도록 만료된 항목을 주기적으로 청소
    @Scheduled(fixedRate = 10 * 60 * 1000)
    public void evictExpiredEntries() {
        codes.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }

    private record CodeEntry(String code, LocalDateTime expiresAt, int attempts) {
        boolean isExpired() {
            return expiresAt.isBefore(LocalDateTime.now());
        }

        CodeEntry withAttemptIncremented() {
            return new CodeEntry(code, expiresAt, attempts + 1);
        }
    }
}
