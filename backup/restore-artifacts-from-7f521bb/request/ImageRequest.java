package com.nyo.domain.common.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "노트/게시글 공용 첨부 이미지 등록 요청 DTO (noteId, postId 중 정확히 하나만 채워야 함)")
public class ImageRequest {

    @Schema(description = "소속 노트 FK (게시글 이미지면 null)", example = "1")
    private Long noteId;

    @Schema(description = "소속 게시글 FK (노트 이미지면 null)", example = "null")
    private Long postId;

    @NotBlank(message = "이미지 URL은 필수입니다.")
    @Size(max = 1000)
    @Schema(description = "이미지 저장 URL", example = "https://cdn.example.com/images/abc.png")
    private String imageUrl;

    @Size(max = 255)
    @Schema(description = "업로드 원본 파일명", example = "screenshot.png")
    private String originalName;

    @Schema(description = "파일 크기(byte)", example = "204800")
    private Long fileSize;

    @Schema(description = "노출 순서", example = "0", defaultValue = "0")
    private Integer displayOrder;

    @AssertTrue(message = "noteId와 postId 중 정확히 하나만 지정해야 합니다.")
    @Schema(hidden = true)
    private boolean isTargetValid() {
        return (noteId != null) ^ (postId != null);
    }
}
