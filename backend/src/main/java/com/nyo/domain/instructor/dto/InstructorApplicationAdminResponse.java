package com.nyo.domain.instructor.dto;

import com.nyo.domain.instructor.entity.InstructorApplicationStatus;

import java.time.LocalDateTime;

/** 관리자 심사 목록에 필요한 신청자 요약 정보. */
public record InstructorApplicationAdminResponse(
        Long id,
        Long applicantId,
        String applicantNickname,
        Long categoryId,
        String categoryName,
        String bio,
        String portfolioUrl,
        Integer careerYears,
        String company,
        String curriculum,
        String attachmentUrl,
        String attachmentName,
        String motivation,
        boolean privacyConsent,
        InstructorApplicationStatus status,
        String rejectReason,
        Long reviewedBy,
        LocalDateTime reviewedAt,
        LocalDateTime createdAt
) {
}
