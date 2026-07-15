package com.nyo.domain.comment.controller;

import com.nyo.domain.comment.dto.CommentRequest;
import com.nyo.domain.comment.dto.CommentResponse;
import com.nyo.domain.comment.service.CommentService;
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
            @RequestParam Long userId,
            @Valid @RequestBody CommentRequest request
    ) {
        return commentService.create(userId, request);
    }

    @PutMapping("/{commentId}")
    public CommentResponse update(
            @PathVariable Long commentId,
            @RequestParam Long userId,
            @Valid @RequestBody CommentRequest request
    ) {
        return commentService.update(commentId, userId, request);
    }

    @DeleteMapping("/{commentId}")
    public void delete(
            @PathVariable Long commentId,
            @RequestParam Long userId
    ) {
        commentService.delete(commentId, userId);
    }
}
