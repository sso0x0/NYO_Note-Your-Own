package com.nyo.domain.post.controller;

import com.nyo.domain.post.service.PostService;
import com.nyo.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 전용 게시글 검색 색인 관리 API. SecurityConfig에서 "/api/admin/**" → hasRole("ADMIN")으로 보호된다.
 */
@Tag(name = "Admin - Post", description = "관리자 게시글 검색 색인 관리 API")
@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor
public class AdminPostController {

    private final PostService postService;

    // 검색 색인 재구축
    @Operation(summary = "게시글 검색 색인 재구축", description = "DB의 전체 일반 게시글(공지 제외)로 Elasticsearch 색인을 다시 만듭니다. 색인 유실 복구, 기존 데이터 최초 반영 등에 사용합니다.")
    @PostMapping("/reindex")
    public ApiResponse<Void> reindexPosts() {
        postService.reindexAllPosts();
        return ApiResponse.ok();
    }
}
