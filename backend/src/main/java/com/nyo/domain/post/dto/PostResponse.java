package com.nyo.domain.post.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "커뮤니티 게시글 응답 DTO")
public class PostResponse {

    @Schema(description = "게시글 PK", example = "1")
    private Long id;

    @Schema(description = "작성자 FK", example = "10")
    private Long userId;

    @Schema(description = "작성자 닉네임", example = "길동이")
    private String authorNickname;

    @Schema(description = "게시글 제목", example = "면접 후기 공유합니다")
    private String title;

    @Schema(description = "게시글 본문")
    private String content;

    @Schema(description = "게시글 대표 썸네일 이미지 URL")
    private String thumbnailUrl;

    @Schema(description = "캐시된 조회수", example = "340")
    private Long viewCount;

    @Schema(description = "캐시된 좋아요수", example = "22")
    private Long likeCount;

    @Schema(description = "삭제 여부", example = "false")
    private Boolean isDeleted;

    @Schema(description = "작성일")
    private LocalDateTime createdAt;

    @Schema(description = "수정일")
    private LocalDateTime updatedAt;
}
