package com.nyo.domain.note.dto;

import com.nyo.global.enums.Role;
import com.nyo.global.enums.UserStatus;
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
@Schema(description = "관리자 노트 관리 목록 응답 DTO (일반 응답에 작성자 상세 정보를 더함)")
public class NoteAdminResponse {

    @Schema(description = "노트 PK", example = "1")
    private Long id;

    @Schema(description = "소속 강의 FK", example = "1")
    private Long lectureId;

    @Schema(description = "소속 강의명", example = "스프링 부트 마스터 클래스")
    private String lectureTitle;

    @Schema(description = "소속 강의 카테고리명", example = "프론트엔드")
    private String lectureCategoryName;

    @Schema(description = "소속 강의 강사명", example = "김강사")
    private String lectureInstructor;

    @Schema(description = "소속 강의 수강 정원 (NULL이면 무제한)", example = "30")
    private Integer lectureCapacity;

    @Schema(description = "소속 강의 현재 등록 인원", example = "12")
    private Integer lectureCurrentEnrolled;

    @Schema(description = "작성자 FK", example = "10")
    private Long userId;

    @Schema(description = "작성자 로그인 아이디", example = "nyo_user01")
    private String authorLoginId;

    @Schema(description = "작성자 닉네임", example = "길동이")
    private String authorNickname;

    @Schema(description = "작성자 이메일", example = "user@example.com")
    private String authorEmail;

    @Schema(description = "작성자 권한", example = "USER")
    private Role authorRole;

    @Schema(description = "작성자 상태", example = "ACTIVE")
    private UserStatus authorStatus;

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

    @Schema(description = "제목 또는 본문에서 감지된 금지어")
    private List<String> prohibitedWords;

    @Schema(description = "작성자 삭제 여부", example = "false")
    private Boolean isDeleted;

    @Schema(description = "최초 작성일")
    private LocalDateTime createdAt;

    @Schema(description = "최종 수정일")
    private LocalDateTime updatedAt;
}
