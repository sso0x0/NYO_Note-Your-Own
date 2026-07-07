package com.nyo.domain.common.dto.response;

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
@Schema(description = "조회수 중복 방지 로그 응답 DTO (상세 조회 시 서버에서 자동 생성)")
public class ViewLogResponse {

    @Schema(description = "조회 로그 PK", example = "1")
    private Long id;

    @Schema(description = "조회한 회원 FK (비로그인은 null)", example = "10")
    private Long userId;

    @Schema(description = "조회 대상 종류", example = "NOTE")
    private String targetType;

    @Schema(description = "대상 PK", example = "1")
    private Long targetId;

    @Schema(description = "조회한 날짜")
    private LocalDate viewedDate;

    @Schema(description = "로그 생성 시각")
    private LocalDateTime createdAt;
}
