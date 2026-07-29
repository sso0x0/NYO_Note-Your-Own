package com.nyo.domain.report.dto;

import com.nyo.domain.report.entity.ReportStatus;
import com.nyo.domain.report.entity.ReportTargetType;

import java.time.LocalDateTime;

/** 관리자 신고 목록에 필요한 신고자와 대상 요약 정보. */
public record ReportAdminResponse(
        Long id,
        ReportTargetType targetType,
        Long targetId,
        String targetTitle,
        String targetContent,
        Long targetUserId,
        long targetPage,
        long userPage,
        Long reporterId,
        String reporterNickname,
        String reason,
        ReportStatus status,
        LocalDateTime createdAt
) {
}
