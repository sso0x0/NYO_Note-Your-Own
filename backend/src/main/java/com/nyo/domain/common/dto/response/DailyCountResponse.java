package com.nyo.domain.common.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "일자별 건수 응답 DTO (노트 작성 현황 / 회원 가입 추이 그래프용)")
public class DailyCountResponse {

    @Schema(description = "날짜", example = "2026-07-11")
    private LocalDate date;

    @Schema(description = "해당 일자 건수 (없는 날은 0으로 채워짐)", example = "5")
    private Long count;
}
