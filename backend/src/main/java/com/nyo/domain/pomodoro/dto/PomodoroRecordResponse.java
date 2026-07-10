package com.nyo.domain.pomodoro.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "뽀모도로 학습 타이머 기록 응답 DTO")
public class PomodoroRecordResponse {

    @Schema(description = "타이머 기록 PK", example = "1")
    private Long id;

    @Schema(description = "기록 주체 회원 FK", example = "10")
    private Long userId;

    @Schema(description = "강의 FK", example = "1")
    private Long lectureId;

    @Schema(description = "노트 FK", example = "1")
    private Long noteId;

    @Schema(description = "집중 시간(분)", example = "25")
    private Integer focusMinutes;

    @Schema(description = "휴식 시간(분)", example = "5")
    private Integer breakMinutes;

    @Schema(description = "타이머 시작 시각")
    private LocalDateTime startedAt;

    @Schema(description = "타이머 종료 시각")
    private LocalDateTime endedAt;

    @Schema(description = "통계 집계용 날짜")
    private LocalDate recordDate;

    @Schema(description = "레코드 생성 시각")
    private LocalDateTime createdAt;
}
