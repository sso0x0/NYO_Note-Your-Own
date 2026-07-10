package com.nyo.domain.comment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "댓글/대댓글 응답 DTO")
public class CommentResponse {

    @Schema(description = "댓글 PK", example = "1")
    private Long id;

    @Schema(description = "소속 게시글 FK", example = "1")
    private Long postId;

    @Schema(description = "작성자 FK", example = "10")
    private Long userId;

    @Schema(description = "작성자 닉네임", example = "길동이")
    private String authorNickname;

    @Schema(description = "상위 댓글 FK", example = "null")
    private Long parentCommentId;

    @Schema(description = "댓글 내용", example = "좋은 정보 감사합니다!")
    private String content;

    @Schema(description = "삭제 여부", example = "false")
    private Boolean isDeleted;

    @Schema(description = "대댓글 목록 (최상위 댓글 조회 시 포함)")
    private List<CommentResponse> replies;

    @Schema(description = "작성일")
    private LocalDateTime createdAt;

    @Schema(description = "수정일")
    private LocalDateTime updatedAt;
}
