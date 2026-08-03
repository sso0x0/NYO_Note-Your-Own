package com.nyo.global.security;

import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 마이페이지 전화번호 변경용 SMS 인증코드를 저장하는 인메모리 저장소.
 * PasswordResetCodeStore와 동일한 구조이되, 로그인 전(loginId 기준)이 아니라 로그인 후(userId 기준)라는 점,
 * 그리고 인증 대상 번호(phone)까지 같이 저장해 "발급받은 번호와 다른 번호로 검증 시도"를 막는다는 점이 다르다.
 * (다중 인스턴스로 확장 시에는 인스턴스별로 따로 저장되므로 공유 저장소로 교체 필요)
 */
@Component
public class PhoneVerificationCodeStore {

    private static final Duration TTL = Duration.ofMinutes(5);
    private static final int MAX_VERIFY_ATTEMPTS = 5;

    // userId를 key로 발급된 (전화번호, 코드)/만료시각/틀린 시도 횟수를 저장
    private final ConcurrentHashMap<Long, CodeEntry> codes = new ConcurrentHashMap<>();

    // 인증코드 발송 시 호출: 새 코드로 덮어써서 이전 코드는 즉시 무효화
    public void save(Long userId, String phone, String code) {
        codes.put(userId, new CodeEntry(phone, code, LocalDateTime.now().plus(TTL), 0));
    }

    // 마이페이지 폼에서 "인증확인" 버튼을 눌렀을 때 호출: 코드가 맞는지만 미리 확인하고,
    // 성공해도 코드를 지우지 않는다. 그래야 이후 실제 저장(수정) 단계에서 같은 코드로 다시 검증할 수 있다.
    public void verifyOnly(Long userId, String phone, String code) {
        CodeEntry entry = codes.get(userId);
        if (entry == null || entry.isExpired() || entry.attempts >= MAX_VERIFY_ATTEMPTS || !entry.phone.equals(phone)) {
            codes.remove(userId);
            throw new BusinessException(ErrorCode.PHONE_VERIFICATION_CODE_INVALID);
        }

        if (!entry.code.equals(code)) {
            codes.put(userId, entry.withAttemptIncremented());
            throw new BusinessException(ErrorCode.PHONE_VERIFICATION_CODE_INVALID);
        }
        // 성공: 코드는 유지 (실제 저장 단계에서 다시 검증 후 소비됨)
    }

    // 마이페이지 정보 수정 저장 시점에 호출: 코드가 맞으면 정상 반환하고 즉시 소모(재사용 방지),
    // 틀리면 예외 + 시도 횟수 증가. 이 메서드가 호출된 뒤에는 같은 코드로 다시 저장할 수 없다.
    public void verify(Long userId, String phone, String code) {
        CodeEntry entry = codes.get(userId);
        if (entry == null || entry.isExpired() || entry.attempts >= MAX_VERIFY_ATTEMPTS || !entry.phone.equals(phone)) {
            codes.remove(userId);
            throw new BusinessException(ErrorCode.PHONE_VERIFICATION_CODE_INVALID);
        }

        if (!entry.code.equals(code)) {
            codes.put(userId, entry.withAttemptIncremented());
            throw new BusinessException(ErrorCode.PHONE_VERIFICATION_CODE_INVALID);
        }

        codes.remove(userId);
    }

    // 인증을 끝까지 완료하지 않고 이탈한 항목이 계속 쌓이지 않도록 만료된 항목을 주기적으로 청소
    @Scheduled(fixedRate = 10 * 60 * 1000)
    public void evictExpiredEntries() {
        codes.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }

    private record CodeEntry(String phone, String code, LocalDateTime expiresAt, int attempts) {
        // 만료 시각이 지났는지 확인한다
        boolean isExpired() {
            return expiresAt.isBefore(LocalDateTime.now());
        }

        // 틀린 시도 횟수만 1 증가시킨 새 엔트리를 반환한다
        CodeEntry withAttemptIncremented() {
            return new CodeEntry(phone, code, expiresAt, attempts + 1);
        }
    }
}
