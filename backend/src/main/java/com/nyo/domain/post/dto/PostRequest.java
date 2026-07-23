package com.nyo.domain.post.dto;

import com.nyo.domain.common.dto.request.ImageRequest;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "커뮤니티 게시글 등록/수정 요청 DTO")
public class PostRequest {

    @NotBlank(message = "게시글 제목은 필수입니다.")
    @Size(max = 200)
    @Schema(description = "게시글 제목", example = "면접 후기 공유합니다")
    private String title;

    @NotBlank(message = "게시글 본문은 필수입니다.")
    @Schema(description = "게시글 본문")
    private String content;

    @Size(max = 1000)
    @Schema(description = "게시글 이미지 URL")
    private String thumbnailUrl;

    @Size(max = 255)
    @Schema(description = "업로드한 이미지 원본 파일명")
    private String imageOriginalName;

    @Schema(description = "업로드한 이미지 파일 크기(byte)")
    private Long imageFileSize;

    @Schema(description = "본문 중간에 삽입된 이미지 목록")
    private List<ImageRequest> contentImages;

    // 관리자 공지 기능: true 요청은 서비스에서 ADMIN 여부를 다시 검증한다.
    @Schema(description = "공지 게시글 여부", example = "false")
    private Boolean notice;
}
