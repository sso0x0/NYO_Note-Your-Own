package com.nyo.domain.common.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "좋아요 응답 DTO")
public class LikeResponse {

    @Schema(description = "좋아요 PK", example = "1")
    private Long id;

    @Schema(description = "좋아요를 누른 회원 FK", example = "10")
    private Long userId;

    @Schema(description = "좋아요 대상 종류", example = "NOTE")
    private String targetType;

    @Schema(description = "대상 PK", example = "1")
    private Long targetId;

    @Schema(description = "좋아요 누른 시각")
    private LocalDateTime createdAt;
}
