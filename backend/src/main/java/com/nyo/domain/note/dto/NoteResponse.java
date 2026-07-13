package com.nyo.domain.note.dto;

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
@Schema(description = "학습 노트 응답 DTO")
public class NoteResponse {

    @Schema(description = "노트 PK", example = "1")
    private Long id;

    @Schema(description = "소속 강의 FK", example = "1")
    private Long lectureId;

    @Schema(description = "소속 강의명", example = "스프링 부트 마스터 클래스")
    private String lectureTitle;

    @Schema(description = "작성자 FK", example = "10")
    private Long userId;

    @Schema(description = "작성자 닉네임", example = "길동이")
    private String authorNickname;

    @Schema(description = "노트 제목", example = "1주차 스프링 부트 정리")
    private String title;

    @Schema(description = "본문(마크다운, 이미지/코드블록 포함)")
    private String content;

    @Schema(description = "노트 대표 썸네일 이미지 URL")
    private String thumbnailUrl;

    @Schema(description = "캐시된 조회수", example = "120")
    private Long viewCount;

    @Schema(description = "캐시된 좋아요수", example = "15")
    private Long likeCount;

    @Schema(description = "작성자 삭제 여부", example = "false")
    private Boolean isDeleted;

    @Schema(description = "최초 작성일")
    private LocalDateTime createdAt;

    @Schema(description = "최종 수정일")
    private LocalDateTime updatedAt;
}
