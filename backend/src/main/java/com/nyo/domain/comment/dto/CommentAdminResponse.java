package com.nyo.domain.comment.dto;

import com.nyo.global.enums.Role;
import com.nyo.global.enums.UserStatus;
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
@Schema(description = "관리자 댓글 관리 목록 응답 DTO")
public class CommentAdminResponse {

    @Schema(description = "댓글 ID", example = "1")
    private Long id;

    @Schema(description = "댓글 대상 타입", example = "POST")
    private CommentTargetType targetType;

    @Schema(description = "대상 게시글/강의 ID", example = "1")
    private Long targetId;

    @Schema(description = "대상 게시글/강의 제목 (대상이 이미 삭제됐으면 null)", example = "겨울방학 스터디 모집")
    private String targetTitle;

    @Schema(description = "댓글 대상 게시글의 삭제 여부", example = "false")
    private Boolean targetDeleted;

    @Schema(description = "상위 댓글 ID", example = "null")
    private Long parentCommentId;

    @Schema(description = "댓글 내용", example = "좋은 정보 감사합니다.")
    private String content;

    @Schema(description = "삭제 여부", example = "false")
    private Boolean isDeleted;

    @Schema(description = "작성자 ID", example = "10")
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

    @Schema(description = "작성일")
    private LocalDateTime createdAt;

    @Schema(description = "수정일")
    private LocalDateTime updatedAt;

    public enum CommentTargetType {
        POST, LECTURE
    }
}
