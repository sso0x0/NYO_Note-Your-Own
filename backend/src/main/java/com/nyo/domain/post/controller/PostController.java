package com.nyo.domain.post.controller;

import com.nyo.domain.post.dto.PostRequest;
import com.nyo.domain.post.dto.PostResponse;
import com.nyo.domain.post.dto.PostPageResponse;
import com.nyo.domain.post.service.PostService;
import com.nyo.global.response.PageResponse;
import com.nyo.global.security.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

import java.util.List;

// 커뮤니티 게시글 CRUD 및 검색/좋아요/조회수 API 컨트롤러.
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // 게시글 목록을 조회한다 (noticeOnly면 공지만, 아니면 최신 공지 3개 + 일반 게시글 페이지).
    @GetMapping
    public PostPageResponse findAll(
            // 커뮤니티 서버 페이지네이션: 기본 10개, 최신 작성일 내림차순으로 조회한다.
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(defaultValue = "false") boolean noticeOnly
    ) {
        return postService.findAll(pageable, noticeOnly);
    }

    // 메인 페이지 "커뮤니티" 인기 목록: 좋아요*5 + 조회수 가중치 점수 내림차순 (공지 제외)
    @GetMapping("/popular")
    public PageResponse<PostResponse> findPopular(
            @PageableDefault(size = 5) Pageable pageable
    ) {
        return postService.getPopular(pageable);
    }

    // 현재 사용자가 공지 게시글을 작성할 권한(관리자 여부)이 있는지 확인한다.
    @GetMapping("/notice-permission")
    public boolean canCreateNotice() {
        // 요청 파라미터를 신뢰하지 않고 JWT 인증 정보의 로그인 사용자로 관리자 권한을 확인합니다.
        return postService.canCreateNotice(SecurityUtil.getCurrentUserId());
    }

    // 마이페이지 - 내가 작성한 게시글 목록 (JWT 인증 필요, SecurityConfig에서 별도 permitAll 없음)
    @GetMapping("/me")
    public PageResponse<PostResponse> getMyPosts(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return postService.getMyPosts(SecurityUtil.getCurrentUserId(), pageable);
    }

    // 게시글 검색 (제목/본문 대상, Elasticsearch 기반). 공지글은 검색 대상에서 제외된다.
    @GetMapping("/search")
    public PageResponse<PostResponse> searchPosts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "all") String searchType,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return postService.searchPosts(keyword, searchType, pageable);
    }

    // 게시글을 작성한다.
    @PostMapping
    public PostResponse create(
            @Valid @RequestBody PostRequest request
    ) {
        // 게시글 작성자는 클라이언트 입력값이 아니라 검증된 JWT의 사용자 ID로 고정합니다.
        return postService.create(SecurityUtil.getCurrentUserId(), request);
    }

    // 게시글 상세를 조회한다.
    @GetMapping("/{postId}")
    public PostResponse findOne(@PathVariable Long postId) {
        return postService.findOne(postId);
    }

    // 게시글 상세 진입 시 호출하면 common.view_logs로 중복 조회를 막고 조회수를 증가시킨다.
    @PostMapping("/{postId}/view")
    public void increaseViewCount(
            @PathVariable Long postId
    ) {
        // 조회자는 요청 파라미터가 아니라 JWT로 인증된 사용자로 고정합니다.
        postService.increaseViewCount(postId, SecurityUtil.getCurrentUserId());
    }

    // 게시글 좋아요 등록: common.likes에 POST 타입으로 저장한다.
    @GetMapping("/{postId}/like")
    public boolean isLiked(@PathVariable Long postId) {
        // 현재 로그인 사용자의 좋아요 여부를 반환해 상세 화면의 하트 아이콘 상태를 결정합니다.
        return postService.isLiked(postId, SecurityUtil.getCurrentUserId());
    }

    // 게시글에 좋아요를 등록한다.
    @PostMapping("/{postId}/like")
    public void like(
            @PathVariable Long postId
    ) {
        postService.likePost(postId, SecurityUtil.getCurrentUserId());
    }

    // 게시글 좋아요 취소: common.likes의 POST 기록을 삭제한다.
    @DeleteMapping("/{postId}/like")
    public void unlike(
            @PathVariable Long postId
    ) {
        postService.unlikePost(postId, SecurityUtil.getCurrentUserId());
    }

    // 게시글을 수정한다.
    @PutMapping("/{postId}")
    public PostResponse update(
            @PathVariable Long postId,
            @Valid @RequestBody PostRequest request
    ) {
        // 수정자는 요청 파라미터가 아닌 JWT 사용자로 고정하며 서비스에서 작성자 본인인지 검증합니다.
        return postService.update(postId, SecurityUtil.getCurrentUserId(), request);
    }

    // 게시글을 삭제한다.
    @DeleteMapping("/{postId}")
    public void delete(
            @PathVariable Long postId
    ) {
        // 삭제 권한은 요청 파라미터가 아니라 JWT로 인증된 작성자 또는 ADMIN인지 서비스에서 검증합니다.
        postService.delete(postId, SecurityUtil.getCurrentUserId());
    }
}
