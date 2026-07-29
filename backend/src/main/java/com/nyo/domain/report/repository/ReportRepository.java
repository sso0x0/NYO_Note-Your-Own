package com.nyo.domain.report.repository;

import com.nyo.domain.report.entity.Report;
import com.nyo.domain.report.entity.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByReporterIdAndTargetTypeAndTargetId(
            Long reporterId, ReportTargetType targetType, Long targetId);

    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
