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
@Schema(description = "본문 중간에 삽입된 이미지 저장 요청 DTO")
public class ContentImageRequest {

    @Size(max = 1000)
    @Schema(description = "본문 이미지 GCS URL")
    private String imageUrl;

    @Size(max = 255)
    @Schema(description = "업로드한 원본 파일명")
    private String originalName;

    @Schema(description = "업로드한 파일 크기(byte)")
    private Long fileSize;

    @Schema(description = "본문 안 이미지 순서")
    private Integer displayOrder;
}
