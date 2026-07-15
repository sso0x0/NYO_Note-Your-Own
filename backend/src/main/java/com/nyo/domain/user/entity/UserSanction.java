package com.nyo.domain.user.entity;

import com.nyo.global.enums.SanctionType;
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

    private Long userId;
    private Long adminId;

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