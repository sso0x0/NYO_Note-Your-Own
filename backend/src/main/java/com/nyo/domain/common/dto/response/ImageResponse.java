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
@Schema(description = "노트/게시글 공용 첨부 이미지 응답 DTO")
public class ImageResponse {

    @Schema(description = "이미지 PK", example = "1")
    private Long id;

    @Schema(description = "소속 노트 FK", example = "1")
    private Long noteId;

    @Schema(description = "소속 게시글 FK", example = "null")
    private Long postId;

    @Schema(description = "이미지 저장 URL", example = "https://cdn.example.com/images/abc.png")
    private String imageUrl;

    @Schema(description = "업로드 원본 파일명", example = "screenshot.png")
    private String originalName;

    @Schema(description = "파일 크기(byte)", example = "204800")
    private Long fileSize;

    @Schema(description = "노출 순서", example = "0")
    private Integer displayOrder;

    @Schema(description = "업로드 시각")
    private LocalDateTime createdAt;
}
