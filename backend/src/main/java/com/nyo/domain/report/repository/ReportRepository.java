package com.nyo.domain.report.repository;

import com.nyo.domain.report.entity.Report;
import com.nyo.domain.report.entity.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

// 신고(Report) 엔티티에 대한 조회를 담당하는 JPA 리포지토리
public interface ReportRepository extends JpaRepository<Report, Long> {

    // 같은 사용자가 같은 대상을 이미 신고했는지 확인한다 (중복 신고 방지용).
    boolean existsByReporterIdAndTargetTypeAndTargetId(
            Long reporterId, ReportTargetType targetType, Long targetId);

    // 전체 신고 목록을 최신순으로 조회한다.
    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // 특정 대상 종류의 신고만 최신순으로 조회한다.
    Page<Report> findByTargetTypeOrderByCreatedAtDesc(ReportTargetType targetType, Pageable pageable);
}
