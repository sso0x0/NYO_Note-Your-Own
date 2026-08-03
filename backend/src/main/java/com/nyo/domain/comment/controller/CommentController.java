package com.nyo.domain.comment.controller;

import com.nyo.domain.comment.dto.CommentMyResponse;
import com.nyo.domain.comment.dto.CommentRequest;
import com.nyo.domain.comment.dto.CommentResponse;
import com.nyo.domain.comment.service.CommentService;
import com.nyo.global.security.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 게시글/강의 댓글 및 대댓글 CRUD API. 작성/수정/삭제는 JWT 인증된 사용자로 권한을 고정한다.
@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // 게시글의 댓글을 대댓글까지 트리 구조로 조회한다.
    @GetMapping("/posts/{postId}")
    public List<CommentResponse> findByPost(@PathVariable Long postId) {
        return commentService.findByPost(postId);
    }

    // 강의의 댓글을 대댓글까지 트리 구조로 조회한다.
    @GetMapping("/lectures/{lectureId}")
    public List<CommentResponse> findByLecture(@PathVariable Long lectureId) {
        return commentService.findByLecture(lectureId);
    }

    // 마이페이지 - 내가 작성한 댓글 목록 (JWT 인증 필요, SecurityConfig에서 별도 permitAll 없음)
    @GetMapping("/me")
    public Page<CommentMyResponse> getMyComments(@PageableDefault(size = 10) Pageable pageable) {
        return commentService.getMyComments(SecurityUtil.getCurrentUserId(), pageable);
    }

    // 댓글 또는 대댓글을 등록한다.
    @PostMapping
    public CommentResponse create(
            @Valid @RequestBody CommentRequest request
    ) {
        // 작성자는 요청 파라미터가 아니라 JWT로 인증된 사용자로 고정합니다.
        return commentService.create(SecurityUtil.getCurrentUserId(), request);
    }

    // 댓글 내용을 수정한다.
    @PutMapping("/{commentId}")
    public CommentResponse update(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request
    ) {
        // 수정자는 요청 파라미터가 아니라 JWT로 인증된 작성자인지 서비스에서 검증합니다.
        return commentService.update(commentId, SecurityUtil.getCurrentUserId(), request);
    }

    // 댓글을 삭제한다.
    @DeleteMapping("/{commentId}")
    public void delete(
            @PathVariable Long commentId
    ) {
        // 삭제 권한은 요청 파라미터가 아니라 JWT로 인증된 작성자인지 서비스에서 검증합니다.
        commentService.delete(commentId, SecurityUtil.getCurrentUserId());
    }
}