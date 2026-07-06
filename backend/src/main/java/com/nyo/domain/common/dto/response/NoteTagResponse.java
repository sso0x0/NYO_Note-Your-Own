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
@Schema(description = "노트-태그 매핑 응답 DTO")
public class NoteTagResponse {

    @Schema(description = "노트 FK", example = "1")
    private Long noteId;

    @Schema(description = "태그 FK", example = "1")
    private Long tagId;

    @Schema(description = "태그명", example = "Spring")
    private String tagName;

    @Schema(description = "AI 자동 태깅 여부", example = "false")
    private Boolean isAiGenerated;

    @Schema(description = "매핑 생성일")
    private LocalDateTime createdAt;
}
