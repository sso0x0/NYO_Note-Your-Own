package com.nyo.domain.common.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "커뮤니티 게시글 등록/수정 요청 DTO (userId는 인증 정보에서 추출)")
public class PostRequest {

    @NotBlank(message = "게시글 제목은 필수입니다.")
    @Size(max = 200)
    @Schema(description = "게시글 제목", example = "면접 후기 공유합니다")
    private String title;

    @NotBlank(message = "게시글 본문은 필수입니다.")
    @Schema(description = "게시글 본문")
    private String content;

    @Size(max = 1000)
    @Schema(description = "게시글 대표 썸네일 이미지 URL")
    private String thumbnailUrl;
}
