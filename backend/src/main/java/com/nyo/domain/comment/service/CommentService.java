package com.nyo.domain.comment.service;

import com.nyo.domain.comment.dto.CommentRequest;
import com.nyo.domain.comment.dto.CommentResponse;
import com.nyo.domain.comment.entity.Comment;
import com.nyo.domain.comment.repository.CommentRepository;
import com.nyo.domain.post.repository.PostRepository;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;

    @Transactional
    public CommentResponse create(Long userId, CommentRequest request) {
        validatePost(request.getPostId());
        validateParent(request.getPostId(), request.getParentCommentId());

        Comment comment = Comment.create(
                request.getPostId(),
                userId,
                request.getParentCommentId(),
                request.getContent()
        );

        return toResponse(commentRepository.save(comment), List.of());
    }

    public List<CommentResponse> findByPost(Long postId) {
        validatePost(postId);

        List<Comment> comments = commentRepository.findByPostIdAndIsDeletedOrderByCreatedAtAsc(postId, 0);
        Map<Long, List<Comment>> childrenByParentId = comments.stream()
                .filter(comment -> comment.getParentCommentId() != null)
                .collect(Collectors.groupingBy(Comment::getParentCommentId));

        return comments.stream()
                .filter(comment -> comment.getParentCommentId() == null)
                .map(comment -> toTreeResponse(comment, childrenByParentId))
                .toList();
    }

    @Transactional
    public CommentResponse update(Long commentId, Long userId, CommentRequest request) {
        Comment comment = getComment(commentId);

        if (!comment.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.COMMENT_ACCESS_DENIED);
        }

        comment.update(request.getContent());
        return toResponse(comment, List.of());
    }

    @Transactional
    public void delete(Long commentId, Long userId) {
        Comment comment = getComment(commentId);

        if (!comment.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.COMMENT_ACCESS_DENIED);
        }

        comment.delete();
    }

    private CommentResponse toTreeResponse(Comment comment, Map<Long, List<Comment>> childrenByParentId) {
        List<CommentResponse> replies = childrenByParentId.getOrDefault(comment.getId(), List.of())
                .stream()
                .map(reply -> toTreeResponse(reply, childrenByParentId))
                .toList();

        return toResponse(comment, replies);
    }

    private CommentResponse toResponse(Comment comment, List<CommentResponse> replies) {
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .userId(comment.getUserId())
                .authorNickname(null)
                .parentCommentId(comment.getParentCommentId())
                .content(comment.getContent())
                .isDeleted(comment.isDeleted())
                .replies(new ArrayList<>(replies))
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    private Comment getComment(Long commentId) {
        return commentRepository.findByIdAndIsDeleted(commentId, 0)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
    }

    private void validatePost(Long postId) {
        postRepository.findByIdAndIsDeleted(postId, 0)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
    }

    private void validateParent(Long postId, Long parentCommentId) {
        if (parentCommentId == null) {
            return;
        }

        Comment parent = getComment(parentCommentId);
        if (!parent.getPostId().equals(postId)) {
            // 대댓글은 같은 게시글 안의 댓글에만 연결할 수 있다.
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }
}
