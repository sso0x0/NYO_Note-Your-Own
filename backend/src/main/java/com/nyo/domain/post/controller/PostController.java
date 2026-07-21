package com.nyo.domain.post.controller;

import com.nyo.domain.post.dto.PostRequest;
import com.nyo.domain.post.dto.PostResponse;
import com.nyo.domain.post.service.PostService;
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

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public List<PostResponse> findAll() {
        return postService.findAll();
    }

    @PostMapping
    public PostResponse create(
            @RequestParam Long userId,
            @Valid @RequestBody PostRequest request
    ) {
        return postService.create(userId, request);
    }

    @GetMapping("/{postId}")
    public PostResponse findOne(@PathVariable Long postId) {
        return postService.findOne(postId);
    }

    // 게시글 상세 진입 시 호출하면 common.view_logs로 중복 조회를 막고 조회수를 증가시킨다.
    @PostMapping("/{postId}/view")
    public void increaseViewCount(
            @PathVariable Long postId,
            @RequestParam Long userId
    ) {
        postService.increaseViewCount(postId, userId);
    }

    // 게시글 좋아요 등록: common.likes에 POST 타입으로 저장한다.
    @PostMapping("/{postId}/like")
    public void like(
            @PathVariable Long postId,
            @RequestParam Long userId
    ) {
        postService.likePost(postId, userId);
    }

    // 게시글 좋아요 취소: common.likes의 POST 기록을 삭제한다.
    @DeleteMapping("/{postId}/like")
    public void unlike(
            @PathVariable Long postId,
            @RequestParam Long userId
    ) {
        postService.unlikePost(postId, userId);
    }

    @PutMapping("/{postId}")
    public PostResponse update(
            @PathVariable Long postId,
            @RequestParam Long userId,
            @Valid @RequestBody PostRequest request
    ) {
        return postService.update(postId, userId, request);
    }

    @DeleteMapping("/{postId}")
    public void delete(
            @PathVariable Long postId,
            @RequestParam Long userId
    ) {
        postService.delete(postId, userId);
    }
}
