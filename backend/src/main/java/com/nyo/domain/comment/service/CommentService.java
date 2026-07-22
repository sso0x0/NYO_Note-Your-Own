package com.nyo.domain.comment.service;

import com.nyo.domain.comment.dto.CommentRequest;
import com.nyo.domain.comment.dto.CommentResponse;
import com.nyo.domain.comment.entity.Comment;
import com.nyo.domain.comment.repository.CommentRepository;
import com.nyo.domain.post.repository.PostRepository;
import com.nyo.domain.user.service.UserService;
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
    private final UserService userService;

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

        Comment savedComment = commentRepository.save(comment);
        return toResponse(savedComment, List.of(), userService.getDisplayNickname(savedComment.getUserId()));
    }

    public List<CommentResponse> findByPost(Long postId) {
        validatePost(postId);

        // 삭제된 댓글도 함께 조회해야 그 밑에 달린(아직 삭제되지 않은) 대댓글이 트리에서 유실되지 않는다.
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        Map<Long, List<Comment>> childrenByParentId = comments.stream()
                .filter(comment -> comment.getParentCommentId() != null)
                .collect(Collectors.groupingBy(Comment::getParentCommentId));
        // 댓글 nickname 표시: 댓글과 대댓글 작성자를 한 번에 조회한다.
        Map<Long, String> nicknames = userService.getDisplayNicknames(
                comments.stream().map(Comment::getUserId).distinct().toList()
        );

        return comments.stream()
                .filter(comment -> comment.getParentCommentId() == null)
                .map(comment -> toTreeResponse(comment, childrenByParentId, nicknames))
                .toList();
    }

    @Transactional
    public CommentResponse update(Long commentId, Long userId, CommentRequest request) {
        Comment comment = getComment(commentId);

        if (!comment.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.COMMENT_ACCESS_DENIED);
        }

        comment.update(request.getContent());
        return toResponse(comment, List.of(), userService.getDisplayNickname(comment.getUserId()));
    }

    @Transactional
    public void delete(Long commentId, Long userId) {
        Comment comment = getComment(commentId);

        if (!comment.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.COMMENT_ACCESS_DENIED);
        }

        comment.delete();
    }

    private CommentResponse toTreeResponse(
            Comment comment, Map<Long, List<Comment>> childrenByParentId, Map<Long, String> nicknames
    ) {
        List<CommentResponse> replies = childrenByParentId.getOrDefault(comment.getId(), List.of())
                .stream()
                .map(reply -> toTreeResponse(reply, childrenByParentId, nicknames))
                .toList();

        return toResponse(
                comment, replies, nicknames.getOrDefault(comment.getUserId(), "알 수 없는 사용자")
        );
    }

    private CommentResponse toResponse(Comment comment, List<CommentResponse> replies, String authorNickname) {
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .userId(comment.getUserId())
                .authorNickname(authorNickname)
                .parentCommentId(comment.getParentCommentId())
                // 삭제된 댓글은 대댓글 트리 유지를 위해 남겨두되 원문 내용은 노출하지 않는다.
                .content(comment.isDeleted() ? "삭제된 댓글입니다." : comment.getContent())
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
            throw new BusinessException(ErrorCode.COMMENT_PARENT_MISMATCH);
        }
    }
}
