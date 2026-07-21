package com.nyo.domain.pomodoro.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "뽀모도로 누적 공부 시간 응답 DTO")
public class PomodoroStudyTimeResponse {

    @Schema(description = "누적 집중 시간(분, 종료된 세션만 집계)", example = "125")
    private Integer totalFocusMinutes;
}
