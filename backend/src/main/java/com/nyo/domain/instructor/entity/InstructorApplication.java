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
import lombok.Builder;
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

    @Column(name = "career_years")
    private Integer careerYears;

    @Column(length = 100)
    private String company;

    @Lob
    @Column
    private String curriculum;

    // 첨부파일(이력서/자격증 등)은 별도 도메인 없이 기존 이미지 업로드(GCS) API로 올린 뒤 URL만 저장한다. 필수 제출 항목.
    @Column(name = "attachment_url", nullable = false, length = 1000)
    private String attachmentUrl;

    @Column(name = "attachment_name", length = 255)
    private String attachmentName;

    @Lob
    @Column(nullable = false)
    private String motivation;

    // 신청 시점의 동의 여부를 그대로 기록해 둔다 (개인정보 수집·이용 동의 증빙).
    @Column(name = "privacy_consent", nullable = false)
    private boolean privacyConsent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private InstructorApplicationStatus status;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Lob
    @Column(name = "reject_reason")
    private String rejectReason;

    // 신청서를 생성한다. 상태는 항상 PENDING으로 시작하고, bio/motivation은 앞뒤 공백을 제거해 저장한다.
    @Builder
    public InstructorApplication(Long userId, Long categoryId, String bio, String portfolioUrl,
                                  Integer careerYears, String company, String curriculum,
                                  String attachmentUrl, String attachmentName,
                                  String motivation, boolean privacyConsent) {
        this.userId = userId;
        this.categoryId = categoryId;
        this.bio = bio.trim();
        this.portfolioUrl = portfolioUrl;
        this.careerYears = careerYears;
        this.company = company;
        this.curriculum = curriculum;
        this.attachmentUrl = attachmentUrl;
        this.attachmentName = attachmentName;
        this.motivation = motivation.trim();
        this.privacyConsent = privacyConsent;
        this.status = InstructorApplicationStatus.PENDING;
    }

    // 신청 상태를 승인으로 바꾸고 심사자/심사일을 기록한다. 실제 권한 승격은 서비스에서 별도로 처리한다.
    public void approve(Long adminId) {
        this.status = InstructorApplicationStatus.APPROVED;
        this.reviewedBy = adminId;
        this.reviewedAt = LocalDateTime.now();
    }

    // 신청 상태를 반려로 바꾸고 사유와 심사자/심사일을 기록한다.
    public void reject(Long adminId, String reason) {
        this.status = InstructorApplicationStatus.REJECTED;
        this.reviewedBy = adminId;
        this.reviewedAt = LocalDateTime.now();
        this.rejectReason = reason;
    }
}
