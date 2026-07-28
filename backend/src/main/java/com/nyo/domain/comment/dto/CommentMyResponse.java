package com.nyo.domain.comment.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommentMyResponse {
    private Long id;
    private Long postId;
    private Long lectureId;
    private String content;
    private LocalDateTime createdAt;
}