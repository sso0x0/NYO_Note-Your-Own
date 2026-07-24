package com.nyo.domain.common.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "뽀모도로 학습 타이머 기록 등록/수정 요청 DTO (userId는 인증 정보에서 추출)")
public class PomodoroRecordRequest {

    @Schema(description = "강의 FK (선택)", example = "1")
    private Long lectureId;

    @Schema(description = "노트 FK (선택)", example = "1")
    private Long noteId;

    @Min(value = 1, message = "집중 시간은 1분 이상이어야 합니다.")
    @Schema(description = "집중 시간(분)", example = "25", defaultValue = "25")
    private Integer focusMinutes;

    @Min(value = 1, message = "휴식 시간은 1분 이상이어야 합니다.")
    @Schema(description = "휴식 시간(분)", example = "5", defaultValue = "5")
    private Integer breakMinutes;

    @NotNull(message = "타이머 시작 시각은 필수입니다.")
    @Schema(description = "타이머 시작 시각")
    private LocalDateTime startedAt;

    @Schema(description = "타이머 종료 시각 (종료 시 업데이트)")
    private LocalDateTime endedAt;
}
