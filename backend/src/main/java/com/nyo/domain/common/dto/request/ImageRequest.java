package com.nyo.domain.common.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "노트/게시글 본문 이미지 저장 요청 DTO")
// DTO 통합: 기존 ContentImageRequest 역할을 ImageRequest 하나로 통일했습니다.
public class ImageRequest {

    @Size(max = 1000)
    @Schema(description = "본문 이미지 GCS URL", example = "https://storage.googleapis.com/bucket/images/abc.png")
    private String imageUrl;

    @Size(max = 255)
    @Schema(description = "업로드 원본 파일명", example = "screenshot.png")
    private String originalName;

    @Schema(description = "파일 크기(byte)", example = "204800")
    private Long fileSize;

    @Schema(description = "본문 내 이미지 표시 순서", example = "1", defaultValue = "1")
    private Integer displayOrder;
}
