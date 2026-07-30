package com.nyo.domain.instructor.entity;

import com.nyo.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** 일반 회원이 강사 권한을 요청하는 신청서. 승인되면 User.role이 INSTRUCTOR로 바뀐다(InstructorApplicationService.approve). */
@Entity
@Table(name = "instructor_applications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InstructorApplication extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Lob
    @Column(nullable = false)
    private String bio;

    @Column(name = "portfolio_url", length = 1000)
    private String portfolioUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private InstructorApplicationStatus status;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    public static InstructorApplication create(Long userId, Long categoryId, String bio, String portfolioUrl) {
        InstructorApplication application = new InstructorApplication();
        application.userId = userId;
        application.categoryId = categoryId;
        application.bio = bio.trim();
        application.portfolioUrl = portfolioUrl;
        application.status = InstructorApplicationStatus.PENDING;
        return application;
    }

    public void approve(Long adminId) {
        this.status = InstructorApplicationStatus.APPROVED;
        this.reviewedBy = adminId;
        this.reviewedAt = LocalDateTime.now();
    }

    public void reject(Long adminId) {
        this.status = InstructorApplicationStatus.REJECTED;
        this.reviewedBy = adminId;
        this.reviewedAt = LocalDateTime.now();
    }
}
