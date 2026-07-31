package com.nyo.domain.user.entity;

import com.nyo.global.enums.SanctionType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 관리자의 회원 제재 이력(경고/정지/강제탈퇴) 엔티티.
 * User.status를 실제로 바꾸는 건 UserService쪽 책임이고, 이 테이블은 "누가 언제 왜 제재했는지" 이력만 남긴다.
 * 정지(SUSPENSION) 건은 endAt으로 해제 시점을 판단해 로그인 시 자동 복구에 쓰인다(endAt이 null이면 무기한 정지).
 */
@Entity
@Table(name = "user_sanctions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserSanction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;   // 제재 대상 회원
    private Long adminId;  // 제재를 처리한 관리자 (본인 제재는 UserService에서 사전 차단됨)

    // 💡 FIXED: String → enum
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SanctionType type;

    private String reason; // 제재 사유

    private LocalDateTime startAt; // 제재 시작 시각
    private LocalDateTime endAt;   // 제재 종료(예정) 시각. null이면 무기한(또는 WARNING처럼 미사용)
    private LocalDateTime createdAt;

    // 제재 이력 생성. startAt/createdAt은 현재 시각으로 자동 채운다.
    @Builder
    public UserSanction(Long userId, Long adminId, SanctionType type, String reason, LocalDateTime endAt) {
        this.userId = userId;
        this.adminId = adminId;
        this.type = type;
        this.reason = reason;
        this.startAt = LocalDateTime.now();
        this.endAt = endAt;
        this.createdAt = LocalDateTime.now();
    }

    // 관리자가 정지를 즉시 해제한 시간을 기존 정지 이력의 종료일로 남깁니다.
    public void release(LocalDateTime releasedAt) {
        this.endAt = releasedAt;
    }

    // WARNING에서는 사용하지 않는 endAt을 경고 팝업 확인 시각으로 재사용해 별도 DB 변경 없이 기록합니다.
    public void acknowledge() {
        this.endAt = LocalDateTime.now();
    }
}
