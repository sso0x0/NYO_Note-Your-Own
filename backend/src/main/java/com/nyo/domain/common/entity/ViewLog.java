package com.nyo.domain.common.entity;

import com.nyo.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

// 조회수 중복 방지 로그 (노트/게시글/강의 공용, 로그인 필수 서비스라 user는 항상 존재)
@Entity
@Table(name = "view_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ViewLog {

    // 조회 로그 PK
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    // 조회한 회원 FK
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 조회 대상 종류 (NOTE, POST, LECTURE)
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", length = 10, nullable = false)
    private TargetType targetType;

    // 조회 대상 PK
    @Column(name = "target_id", nullable = false)
    private Long targetId;

    // 조회한 날짜 (하루 1회 중복 방지 기준)
    @Column(name = "viewed_date", nullable = false)
    private LocalDate viewedDate;

    // 로그 생성 시각 (자동 생성)
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public ViewLog(User user, TargetType targetType, Long targetId, LocalDate viewedDate) {
        this.user = user;
        this.targetType = targetType;
        this.targetId = targetId;
        this.viewedDate = viewedDate;
    }
}