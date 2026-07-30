package com.nyo.domain.instructor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** 사용자가 강사 등록을 신청할 때 보내는 전문 분야/소개/증빙 링크. 신청자 ID는 JWT에서 가져온다. */
public record InstructorApplicationRequest(
        @NotNull(message = "전문 분야(카테고리)를 선택해 주세요.")
        Long categoryId,
        @NotBlank(message = "경력 및 소개를 입력해 주세요.")
        @Size(max = 4000, message = "소개는 4000자 이하로 입력해 주세요.")
        String bio,
        @Size(max = 1000, message = "포트폴리오 링크는 1000자 이하로 입력해 주세요.")
        String portfolioUrl
) {
}
