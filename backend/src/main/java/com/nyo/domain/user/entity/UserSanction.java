package com.nyo.domain.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_sanctions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserSanction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 💡 User 엔티티가 연관관계(@ManyToOne) 안 쓰고 String role/status처럼 단순 필드로 관리하는
    // 기존 스타일에 맞춰서, 여기도 FK 매핑 대신 Long userId/adminId로 통일했습니다.
    private Long userId;
    private Long adminId;

    private String type;   // WARNING, SUSPENSION, WITHDRAWAL
    private String reason;

    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private LocalDateTime createdAt;

    @Builder
    public UserSanction(Long userId, Long adminId, String type, String reason, LocalDateTime endAt) {
        this.userId = userId;
        this.adminId = adminId;
        this.type = type;
        this.reason = reason;
        this.startAt = LocalDateTime.now();
        this.endAt = endAt;
        this.createdAt = LocalDateTime.now();
    }
}