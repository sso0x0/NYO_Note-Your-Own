package com.nyo.domain.common.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "관리자 대시보드 전체 요약 응답 DTO")
public class AdminSummaryResponse {

    @Schema(description = "전체 회원 수", example = "120")
    private Long totalUsers;

    @Schema(description = "전체 강의 수 (삭제 제외)", example = "35")
    private Long totalLectures;

    @Schema(description = "전체 노트 수 (삭제 제외)", example = "480")
    private Long totalNotes;

    @Schema(description = "전체 게시글 수 (삭제 제외)", example = "96")
    private Long totalPosts;
}
