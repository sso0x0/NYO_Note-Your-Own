package com.nyo.domain.lecture.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 관리자가 강사의 강의 등록 신청을 반려할 때 함께 남기는 사유. */
public record LectureRejectRequest(
        @NotBlank(message = "반려 사유를 입력해 주세요.")
        @Size(max = 1000, message = "반려 사유는 1000자 이하로 입력해 주세요.")
        String reason
) {
}
