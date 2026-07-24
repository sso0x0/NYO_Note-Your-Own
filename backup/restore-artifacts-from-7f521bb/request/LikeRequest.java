package com.nyo.domain.common.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "좋아요 등록/취소 요청 DTO (userId는 인증 정보에서 추출)")
public class LikeRequest {

    @NotBlank(message = "좋아요 대상 종류는 필수입니다.")
    @Pattern(regexp = "NOTE|POST|LECTURE", message = "대상 종류는 NOTE, POST, LECTURE 중 하나여야 합니다.")
    @Schema(description = "좋아요 대상 종류", example = "NOTE")
    private String targetType;

    @NotNull(message = "대상 ID는 필수입니다.")
    @Schema(description = "대상 PK", example = "1")
    private Long targetId;
}
