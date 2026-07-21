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

    private String reason;

    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private LocalDateTime createdAt;

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
}