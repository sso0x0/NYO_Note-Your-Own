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
@Schema(description = "강의별 인기도 통계 응답 DTO (관리자 대시보드 그래프용)")
public class LecturePopularityResponse {

    @Schema(description = "강의 PK", example = "1")
    private Long lectureId;

    @Schema(description = "강의명", example = "스프링 부트 마스터 클래스")
    private String title;

    @Schema(description = "좋아요 수", example = "42")
    private Long likeCount;

    @Schema(description = "조회수", example = "310")
    private Long viewCount;

    @Schema(description = "현재 등록 인원", example = "25")
    private Long currentEnrolled;

    @Schema(description = "해당 강의에 작성된 노트 수", example = "12")
    private Long noteCount;
}
