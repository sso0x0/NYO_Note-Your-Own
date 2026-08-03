package com.nyo.domain.lecture.dto;

import com.nyo.domain.lecture.entity.Lecture;
import com.nyo.domain.lecture.entity.LectureStatus;
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
@Schema(description = "관리자 강의 관리 목록 응답 DTO (일반 응답에 노트/댓글 개수를 더함)")
// 관리자 강의 관리 화면에 내려주는 응답 DTO
public class LectureAdminResponse {

    @Schema(description = "강의 PK", example = "1")
    private Long id;

    @Schema(description = "소속 카테고리 FK", example = "1")
    private Long categoryId;

    @Schema(description = "소속 카테고리명", example = "프론트엔드")
    private String categoryName;

    @Schema(description = "강의명", example = "스프링 부트 마스터 클래스")
    private String title;

    @Schema(description = "강사명", example = "김강사")
    private String instructor;

    @Schema(description = "강의 설명")
    private String description;

    @Schema(description = "강의 링크 (현재는 유튜브 링크만 지원)", example = "https://www.youtube.com/watch?v=xxxxxxxxxxx")
    private String lectureUrl;

    @Schema(description = "강의 대표 썸네일 이미지 URL (lectureUrl에서 서버가 자동으로 추출)", example = "https://img.youtube.com/vi/xxxxxxxxxxx/mqdefault.jpg")
    private String thumbnailUrl;

    @Schema(description = "복습용 자료 URL (선택)", example = "https://example.com/review")
    private String reviewUrl;

    @Schema(description = "등록한 회원 FK", example = "1")
    private Long createdById;

    @Schema(description = "등록한 회원 닉네임 (관리자가 직접 등록한 경우 관리자 닉네임)", example = "김강사")
    private String createdByNickname;

    @Schema(description = "심사 상태 (관리자 등록은 즉시 APPROVED, 강사 등록 신청은 PENDING부터 시작)", example = "APPROVED")
    private LectureStatus status;

    @Schema(description = "반려 사유 (REJECTED일 때만 값이 있음)")
    private String rejectReason;

    @Schema(description = "심사(승인/반려) 처리 시각")
    private LocalDateTime reviewedAt;

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

    @Schema(description = "관리자 삭제 여부 (true면 삭제된 강의, DB에서 완전히 삭제되기 전까지 목록에 남아 복구할 수 있음)", example = "false")
    private Boolean isDeleted;

    @Schema(description = "이 강의에 달린 노트 개수", example = "24")
    private Long noteCount;

    @Schema(description = "이 강의에 달린 댓글 개수 (대댓글 포함)", example = "57")
    private Long commentCount;

    @Schema(description = "등록일")
    private LocalDateTime createdAt;

    @Schema(description = "수정일")
    private LocalDateTime updatedAt;

    // 강의 엔티티와 노트/댓글 개수를 합쳐 관리자용 응답 DTO로 변환한다
    public static LectureAdminResponse from(Lecture lecture, long noteCount, long commentCount) {
        return LectureAdminResponse.builder()
                .id(lecture.getId())
                .categoryId(lecture.getCategory().getId())
                .categoryName(lecture.getCategory().getName())
                .title(lecture.getTitle())
                .instructor(lecture.getInstructor())
                .description(lecture.getDescription())
                .lectureUrl(lecture.getLectureUrl())
                .thumbnailUrl(lecture.getThumbnailUrl())
                .reviewUrl(lecture.getReviewUrl())
                .createdById(lecture.getCreatedBy().getId())
                .createdByNickname(lecture.getCreatedBy().getNickname())
                .status(lecture.getStatus())
                .rejectReason(lecture.getRejectReason())
                .reviewedAt(lecture.getReviewedAt())
                .capacity(lecture.getCapacity())
                .currentEnrolled(lecture.getCurrentEnrolled())
                .viewCount(lecture.getViewCount())
                .likeCount(lecture.getLikeCount())
                .isPopular(lecture.getIsPopular())
                .isDeleted(lecture.getIsDeleted())
                .noteCount(noteCount)
                .commentCount(commentCount)
                .createdAt(lecture.getCreatedAt())
                .updatedAt(lecture.getUpdatedAt())
                .build();
    }
}
