package com.nyo.domain.common.entity;

import com.nyo.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

// 좋아요 엔티티 (노트/게시글/강의 공용, 강의 수강신청(ENROLL)도 동일 구조를 재활용)
@Entity
@Table(name = "likes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Like {

    // 좋아요 PK
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    // 좋아요를 누른 회원 FK
    // TODO: 추후 USER 확인 필요
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 좋아요 대상 종류 (노트, 게시글, 강의)
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", length = 10, nullable = false)
    private TargetType targetType;

    // 좋아요 대상 PK (target_type에 따라 notes/posts/lectures의 id를 가리킴)
    @Column(name = "target_id", nullable = false)
    private Long targetId;

    // 좋아요 누른 시각 (자동 생성)
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Like(User user, TargetType targetType, Long targetId) {
        this.user = user;
        this.targetType = targetType;
        this.targetId = targetId;
    }
}