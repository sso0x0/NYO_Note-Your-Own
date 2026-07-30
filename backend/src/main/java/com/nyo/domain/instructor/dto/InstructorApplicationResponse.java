package com.nyo.domain.instructor.dto;

import com.nyo.domain.instructor.entity.InstructorApplicationStatus;

import java.time.LocalDateTime;

/** 신청자 본인이 자기 신청 내역/심사 상태를 확인할 때 쓰는 응답. */
public record InstructorApplicationResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String bio,
        String portfolioUrl,
        InstructorApplicationStatus status,
        LocalDateTime reviewedAt,
        LocalDateTime createdAt
) {
}
