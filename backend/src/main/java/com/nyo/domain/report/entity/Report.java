package com.nyo.domain.report.entity;

import com.nyo.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "reports",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_reports_reporter_target",
                columnNames = {"reporter_id", "target_type", "target_id"}
        )
)
// reports 테이블과 매핑되는 신고 엔티티. 신고자, 신고 대상, 사유, 확인 상태를 가진다.
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private ReportTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportStatus status;

    // 새 신고를 PENDING 상태로 생성한다. 사유는 앞뒤 공백을 제거해 저장한다.
    public static Report create(Long reporterId, ReportTargetType targetType, Long targetId, String reason) {
        Report report = new Report();
        report.reporterId = reporterId;
        report.targetType = targetType;
        report.targetId = targetId;
        report.reason = reason.trim();
        report.status = ReportStatus.PENDING;
        return report;
    }

    // 관리자가 신고 내용을 확인 처리한다 (대상에 대한 별도 조치는 포함하지 않음).
    public void markReviewed() {
        this.status = ReportStatus.REVIEWED;
    }
}
