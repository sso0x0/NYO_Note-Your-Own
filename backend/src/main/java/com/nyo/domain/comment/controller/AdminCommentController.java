package com.nyo.domain.comment.controller;

import com.nyo.domain.comment.dto.CommentAdminResponse;
import com.nyo.domain.comment.service.CommentService;
import com.nyo.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 전용 댓글 관리 API. SecurityConfig에서 "/api/admin/**" → hasRole("ADMIN")으로 보호되므로
 * 여기 메서드들은 인증/권한 체크를 따로 하지 않는다 (필터 단에서 이미 걸러짐).
 */
@Tag(name = "Admin - Comment", description = "관리자 댓글 관리 API")
@RestController
@RequestMapping("/api/admin/comments")
@RequiredArgsConstructor
public class AdminCommentController {

    private final CommentService commentService;

    // 정렬은 리포지토리 쿼리에 이미 고정돼 있어 size(페이지 크기)만 받는다.
    // targetType을 주면 POST/LECTURE 중 해당 유형의 댓글만, 비우면 전체를 조회한다.
    @Operation(summary = "댓글 목록 조회 (게시글/강의 댓글 통합, 유형 필터, 최신순)")
    @GetMapping
    public ApiResponse<Page<CommentAdminResponse>> getCommentList(
            @RequestParam(required = false) CommentAdminResponse.CommentTargetType targetType,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ApiResponse.ok(commentService.adminGetCommentList(targetType, pageable));
    }

    // 삭제된 댓글을 복구한다.
    @Operation(summary = "삭제된 댓글 복구")
    @PostMapping("/{commentId}/restore")
    public ApiResponse<Void> restoreComment(@PathVariable Long commentId) {
        commentService.adminRestore(commentId);
        return ApiResponse.ok();
    }
}
