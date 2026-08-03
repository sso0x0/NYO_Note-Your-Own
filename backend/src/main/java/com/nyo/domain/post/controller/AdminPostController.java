package com.nyo.domain.post.controller;

import com.nyo.domain.post.dto.PostAdminResponse;
import com.nyo.domain.post.service.PostService;
import com.nyo.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 전용 게시글 관리 API. SecurityConfig에서 "/api/admin/**" → hasRole("ADMIN")으로 보호된다.
 */
@Tag(name = "Admin - Post", description = "관리자 게시글 관리 API")
@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor
public class AdminPostController {

    private final PostService postService;

    // 관리자 게시글 관리 목록 (작성자 이메일/권한 등 상세 정보 포함)
    @Operation(summary = "게시글 목록 조회 (작성자 상세 정보 포함)")
    @GetMapping
    public ApiResponse<Page<PostAdminResponse>> getPostList(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return ApiResponse.ok(postService.adminGetPostList(pageable));
    }

    // 삭제된 게시글을 복구한다.
    @Operation(summary = "삭제된 게시글 복구")
    @PostMapping("/{postId}/restore")
    public ApiResponse<Void> restorePost(@PathVariable Long postId) {
        postService.adminRestore(postId);
        return ApiResponse.ok();
    }

    // 검색 색인 재구축
    @Operation(summary = "게시글 검색 색인 재구축", description = "DB의 전체 일반 게시글(공지 제외)로 Elasticsearch 색인을 다시 만듭니다. 색인 유실 복구, 기존 데이터 최초 반영 등에 사용합니다.")
    @PostMapping("/reindex")
    public ApiResponse<Void> reindexPosts() {
        postService.reindexAllPosts();
        return ApiResponse.ok();
    }
}
