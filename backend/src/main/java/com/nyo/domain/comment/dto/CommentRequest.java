package com.nyo.domain.comment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
// 댓글/대댓글 등록 및 수정 요청 DTO.
@Schema(description = "댓글/대댓글 등록 및 수정 요청 DTO")
public class CommentRequest {

    // 게시글 댓글이면 postId만, 강의 댓글이면 lectureId만 채운다 (둘 다 채워지거나 둘 다 비면 서비스에서 예외).
    @Schema(description = "게시글 ID. 게시글 댓글일 때만 채움", example = "1")
    private Long postId;

    @Schema(description = "강의 ID. 강의 댓글일 때만 채움", example = "null")
    private Long lectureId;

    @Schema(description = "상위 댓글 ID. 일반 댓글이면 null", example = "null")
    private Long parentCommentId;

    @NotBlank(message = "댓글 내용은 필수입니다.")
    @Schema(description = "댓글 내용", example = "좋은 정보 감사합니다.")
    private String content;
}
