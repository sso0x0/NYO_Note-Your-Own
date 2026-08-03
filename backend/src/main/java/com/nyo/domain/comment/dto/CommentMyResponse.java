package com.nyo.domain.comment.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

// 마이페이지 - 내가 작성한 댓글 목록 응답 DTO.
@Getter
@Builder
public class CommentMyResponse {
    private Long id;
    private Long postId;
    private Long lectureId;
    private String content;
    private LocalDateTime createdAt;
}