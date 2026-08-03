package com.nyo.domain.report.dto;

import com.nyo.domain.report.entity.ReportTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** 사용자가 신고 창에서 보내는 대상과 신고 사유. 신고자 ID는 JWT에서 가져온다. */
public record ReportRequest(
        @NotNull(message = "신고 대상 종류가 필요합니다.")
        ReportTargetType targetType,

        @NotNull(message = "신고 대상 ID가 필요합니다.")
        Long targetId,

        @NotBlank(message = "신고 사유를 입력해 주세요.")
        @Size(max = 1000, message = "신고 사유는 1000자 이하로 입력해 주세요.")
        String reason
) {
}
