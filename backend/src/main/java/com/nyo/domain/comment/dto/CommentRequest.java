package com.nyo.domain.comment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "댓글/대댓글 등록/수정 요청 DTO (userId는 인증 정보에서 추출)")
public class CommentRequest {

    @NotNull(message = "게시글 ID는 필수입니다.")
    @Schema(description = "소속 게시글 FK", example = "1")
    private Long postId;

    @Schema(description = "상위 댓글 FK (최상위 댓글이면 null)", example = "null")
    private Long parentCommentId;

    @NotBlank(message = "댓글 내용은 필수입니다.")
    @Schema(description = "댓글 내용", example = "좋은 정보 감사합니다!")
    private String content;
}
