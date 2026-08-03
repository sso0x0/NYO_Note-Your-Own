package com.nyo.domain.instructor.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** 사용자가 강사 등록을 신청할 때 보내는 전문 분야/경력/커리큘럼/증빙 자료. 신청자 ID는 JWT에서 가져온다. */
public record InstructorApplicationRequest(
        @NotNull(message = "전문 분야(카테고리)를 선택해 주세요.")
        Long categoryId,

        @NotBlank(message = "경력 및 소개를 입력해 주세요.")
        @Size(max = 4000, message = "소개는 4000자 이하로 입력해 주세요.")
        String bio,

        @Size(max = 1000, message = "포트폴리오 링크는 1000자 이하로 입력해 주세요.")
        String portfolioUrl,

        @Min(value = 0, message = "경력 연차는 0 이상이어야 합니다.")
        @Max(value = 80, message = "경력 연차를 다시 확인해 주세요.")
        Integer careerYears,

        @Size(max = 100, message = "소속/직함은 100자 이하로 입력해 주세요.")
        String company,

        @Size(max = 4000, message = "강의 계획 소개는 4000자 이하로 입력해 주세요.")
        String curriculum,

        @NotBlank(message = "증빙 파일을 첨부해 주세요.")
        @Size(max = 1000, message = "첨부파일 URL은 1000자 이하로 입력해 주세요.")
        String attachmentUrl,

        @Size(max = 255, message = "첨부파일 이름은 255자 이하로 입력해 주세요.")
        String attachmentName,

        @NotBlank(message = "신청 동기를 입력해 주세요.")
        @Size(max = 2000, message = "신청 동기는 2000자 이하로 입력해 주세요.")
        String motivation,

        @AssertTrue(message = "개인정보 수집·이용에 동의해야 신청할 수 있습니다.")
        boolean privacyConsent
) {
}
