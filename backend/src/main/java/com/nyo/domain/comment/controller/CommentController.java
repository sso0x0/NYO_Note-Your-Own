package com.nyo.domain.comment.controller;

import com.nyo.domain.comment.dto.CommentRequest;
import com.nyo.domain.comment.dto.CommentResponse;
import com.nyo.domain.comment.service.CommentService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/posts/{postId}")
    public List<CommentResponse> findByPost(@PathVariable Long postId) {
        return commentService.findByPost(postId);
    }

    @PostMapping
    public CommentResponse create(
            @Valid @RequestBody CommentRequest request
    ) {
        // 작성자는 요청 파라미터가 아니라 JWT로 인증된 사용자로 고정합니다.
        return commentService.create(SecurityUtil.getCurrentUserId(), request);
    }

    @PutMapping("/{commentId}")
    public CommentResponse update(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request
    ) {
        // 수정자는 요청 파라미터가 아니라 JWT로 인증된 작성자인지 서비스에서 검증합니다.
        return commentService.update(commentId, SecurityUtil.getCurrentUserId(), request);
    }

    @DeleteMapping("/{commentId}")
    public void delete(
            @PathVariable Long commentId
    ) {
        // 삭제 권한은 요청 파라미터가 아니라 JWT로 인증된 작성자인지 서비스에서 검증합니다.
        commentService.delete(commentId, SecurityUtil.getCurrentUserId());
    }
}
