package com.nyo.domain.lecture.dto;

import com.nyo.domain.lecture.entity.Lecture;
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
@Schema(description = "강의(녹화본) 응답 DTO")
public class LectureResponse {

    @Schema(description = "강의 PK", example = "1")
    private Long id;

    @Schema(description = "소속 카테고리 FK", example = "1")
    private Long categoryId;

    @Schema(description = "소속 카테고리명", example = "프론트엔드")
    private String categoryName;

    @Schema(description = "등록한 관리자 FK", example = "1")
    private Long createdBy;

    @Schema(description = "강의명", example = "스프링 부트 마스터 클래스")
    private String title;

    @Schema(description = "강의 설명")
    private String description;

    @Schema(description = "강의 링크", example = "https://example.com/lectures/1")
    private String lectureUrl;

    @Schema(description = "강사명", example = "김강사")
    private String instructor;

    @Schema(description = "수강 정원", example = "30")
    private Integer capacity;

    @Schema(description = "현재 등록 인원", example = "12")
    private Integer currentEnrolled;

    @Schema(description = "캐시된 조회수", example = "1024")
    private Long viewCount;

    @Schema(description = "캐시된 좋아요수", example = "58")
    private Long likeCount;

    @Schema(description = "인기 강의 여부", example = "false")
    private Boolean isPopular;

    @Schema(description = "관리자 삭제 여부", example = "false")
    private Boolean isDeleted;

    @Schema(description = "등록일")
    private LocalDateTime createdAt;

    @Schema(description = "수정일")
    private LocalDateTime updatedAt;

    /** Entity -> DTO 변환용 정적 팩토리 메서드 */
    public static LectureResponse from(Lecture lecture) {
        return LectureResponse.builder()
                .id(lecture.getId())
                .categoryId(lecture.getCategory().getId())
                .categoryName(lecture.getCategory().getName())
                .createdBy(lecture.getCreatedBy().getId())   // User 엔티티에서 id 꺼냄
                .title(lecture.getTitle())
                .description(lecture.getDescription())
                .lectureUrl(lecture.getLectureUrl())
                .instructor(lecture.getInstructor())
                .capacity(lecture.getCapacity())
                .currentEnrolled(lecture.getCurrentEnrolled())
                .viewCount(lecture.getViewCount())
                .likeCount(lecture.getLikeCount())
                .isPopular(lecture.getIsPopular())
                .isDeleted(lecture.getIsDeleted())
                .createdAt(lecture.getCreatedAt())
                .updatedAt(lecture.getUpdatedAt())
                .build();
    }
}
