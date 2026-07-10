package com.nyo.domain.note.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "노트 등록/수정 요청 DTO (userId는 인증 정보에서 추출)")
public class NoteRequest {

    @NotNull(message = "강의 ID는 필수입니다.")
    @Schema(description = "소속 강의 FK", example = "1")
    private Long lectureId;

    @NotBlank(message = "노트 제목은 필수입니다.")
    @Size(max = 200)
    @Schema(description = "노트 제목", example = "1주차 스프링 부트 정리")
    private String title;

    @NotBlank(message = "노트 본문은 필수입니다.")
    @Schema(description = "본문(마크다운, 이미지/코드블록 포함)")
    private String content;

    @Size(max = 1000)
    @Schema(description = "노트 대표 썸네일 이미지 URL")
    private String thumbnailUrl;
}
