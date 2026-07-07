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
@Schema(description = "해시태그 응답 DTO")
public class TagResponse {

    @Schema(description = "태그 PK", example = "1")
    private Long id;

    @Schema(description = "태그명", example = "Spring")
    private String name;

    @Schema(description = "생성일")
    private LocalDateTime createdAt;
}
