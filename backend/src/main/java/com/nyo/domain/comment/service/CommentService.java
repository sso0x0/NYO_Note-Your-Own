package com.nyo.domain.comment.service;

import com.nyo.domain.comment.dto.CommentAdminResponse;
import com.nyo.domain.comment.dto.CommentRequest;
import com.nyo.domain.comment.dto.CommentResponse;
import com.nyo.domain.comment.entity.Comment;
import com.nyo.domain.comment.repository.CommentRepository;
import com.nyo.domain.lecture.entity.Lecture;
import com.nyo.domain.lecture.repository.LectureRepository;
import com.nyo.domain.post.entity.Post;
import com.nyo.domain.post.repository.PostRepository;
import com.nyo.domain.user.dto.UserResponse;
import com.nyo.domain.user.service.UserService;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final LectureRepository lectureRepository;
    private final UserService userService;
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public CommentResponse create(Long userId, CommentRequest request) {
        boolean hasPostId = request.getPostId() != null;
        boolean hasLectureId = request.getLectureId() != null;
        if (hasPostId == hasLectureId) {
            // 게시글 댓글이면 postId만, 강의 댓글이면 lectureId만 채워져야 한다.
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        Comment comment;
        if (hasPostId) {
            validatePost(request.getPostId());
            validateParent(request.getParentCommentId(), parent -> request.getPostId().equals(parent.getPostId()));
            comment = Comment.createForPost(request.getPostId(), userId, request.getParentCommentId(), request.getContent());
        } else {
            validateLecture(request.getLectureId());
            validateParent(request.getParentCommentId(), parent -> request.getLectureId().equals(parent.getLectureId()));
            comment = Comment.createForLecture(request.getLectureId(), userId, request.getParentCommentId(), request.getContent());
        }

        Comment savedComment = commentRepository.save(comment);
        return toResponse(savedComment, List.of(), userService.getDisplayNickname(savedComment.getUserId()));
    }

    public List<CommentResponse> findByPost(Long postId) {
        validatePost(postId);

        // 일반 사용자에게는 is_deleted=1인 댓글을 노출하지 않는다.
        List<Comment> comments = commentRepository.findByPostIdAndIsDeletedOrderByCreatedAtAsc(postId, 0);
        return buildTree(comments);
    }

    public List<CommentResponse> findByLecture(Long lectureId) {
        validateLecture(lectureId);

        // 일반 사용자에게는 is_deleted=1인 댓글을 노출하지 않는다.
        List<Comment> comments = commentRepository.findByLectureIdAndIsDeletedOrderByCreatedAtAsc(lectureId, 0);
        return buildTree(comments);
    }

    // 관리자 댓글 관리 목록: 게시글/강의 댓글을 한 화면에서 최신순으로 페이징 조회하고,
    // 작성자 상세 정보(이메일/권한 등)와 댓글이 달린 게시글/강의 제목까지 함께 내려준다.
    // targetType이 null이면 전체, POST/LECTURE면 해당 유형만 필터링한다.
    public Page<CommentAdminResponse> adminGetCommentList(CommentAdminResponse.CommentTargetType targetType, Pageable pageable) {
        Page<Comment> comments;
        if (targetType == CommentAdminResponse.CommentTargetType.POST) {
            comments = commentRepository.findByPostIdIsNotNullOrderByCreatedAtDesc(pageable);
        } else if (targetType == CommentAdminResponse.CommentTargetType.LECTURE) {
            comments = commentRepository.findByLectureIdIsNotNullOrderByCreatedAtDesc(pageable);
        } else {
            // 관리자에게는 삭제된 댓글도 포함하고, 삭제 상태는 응답의 isDeleted로 전달한다.
            comments = commentRepository.findAll(
                    org.springframework.data.domain.PageRequest.of(
                            pageable.getPageNumber(),
                            pageable.getPageSize(),
                            org.springframework.data.domain.Sort.by(
                                    org.springframework.data.domain.Sort.Direction.DESC,
                                    "createdAt"
                            )
                    )
            );
        }

        List<Comment> content = comments.getContent();
        Map<Long, UserResponse> usersById = userService.adminGetUsersByIds(
                content.stream().map(Comment::getUserId).distinct().toList()
        );
        Map<Long, Post> postsById = postRepository.findAllById(
                content.stream().map(Comment::getPostId).filter(Objects::nonNull).distinct().toList()
        ).stream().collect(Collectors.toMap(Post::getId, post -> post));
        Map<Long, String> lectureTitlesById = lectureRepository.findAllById(
                content.stream().map(Comment::getLectureId).filter(Objects::nonNull).distinct().toList()
        ).stream().collect(Collectors.toMap(Lecture::getId, Lecture::getTitle));

        return comments.map(comment -> toAdminResponse(comment, usersById, postsById, lectureTitlesById));
    }

    private CommentAdminResponse toAdminResponse(
            Comment comment,
            Map<Long, UserResponse> usersById,
            Map<Long, Post> postsById,
            Map<Long, String> lectureTitlesById
    ) {
        boolean isPostComment = comment.getPostId() != null;
        UserResponse author = usersById.get(comment.getUserId());
        Post targetPost = isPostComment ? postsById.get(comment.getPostId()) : null;

        return CommentAdminResponse.builder()
                .id(comment.getId())
                .targetType(isPostComment ? CommentAdminResponse.CommentTargetType.POST : CommentAdminResponse.CommentTargetType.LECTURE)
                .targetId(isPostComment ? comment.getPostId() : comment.getLectureId())
                .targetTitle(isPostComment ? (targetPost != null ? targetPost.getTitle() : null) : lectureTitlesById.get(comment.getLectureId()))
                // 게시글이 없거나 삭제된 상태면 댓글만 먼저 복구하지 못하게 프론트에 상태를 전달한다.
                .targetDeleted(isPostComment && (targetPost == null || targetPost.isDeleted()))
                .parentCommentId(comment.getParentCommentId())
                .content(comment.getContent())
                .isDeleted(comment.isDeleted())
                .userId(comment.getUserId())
                .authorLoginId(author != null ? author.getLoginId() : null)
                .authorNickname(author != null ? author.getNickname() : "알 수 없는 사용자")
                .authorEmail(author != null ? author.getEmail() : null)
                .authorRole(author != null ? author.getRole() : null)
                .authorStatus(author != null ? author.getStatus() : null)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    private List<CommentResponse> buildTree(List<Comment> comments) {
        Set<Long> visibleCommentIds = comments.stream()
                .map(Comment::getId)
                .collect(Collectors.toSet());
        Map<Long, List<Comment>> childrenByParentId = comments.stream()
                .filter(comment -> comment.getParentCommentId() != null)
                .collect(Collectors.groupingBy(Comment::getParentCommentId));
        // 댓글 nickname 표시: 댓글과 대댓글 작성자를 한 번에 조회한다.
        Map<Long, String> nicknames = userService.getDisplayNicknames(
                comments.stream().map(Comment::getUserId).distinct().toList()
        );

        return comments.stream()
                // 삭제된 부모 댓글은 숨기되, 남아 있는 답글은 최상위 댓글처럼 계속 보여준다.
                .filter(comment -> comment.getParentCommentId() == null
                        || !visibleCommentIds.contains(comment.getParentCommentId()))
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

        if (!comment.getUserId().equals(userId) && !isAdmin(userId)) {
            throw new BusinessException(ErrorCode.COMMENT_ACCESS_DENIED);
        }

        comment.delete();
    }

    @Transactional
    public void adminRestore(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        if (comment.getPostId() != null) {
            Post post = postRepository.findById(comment.getPostId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
            // 삭제된 게시글의 댓글은 게시글 복구 과정에서 함께 복구해야 한다.
            if (post.isDeleted()) {
                throw new BusinessException(ErrorCode.COMMENT_ACCESS_DENIED);
            }
        }
        comment.restore();
    }

    private boolean isAdmin(Long userId) {
        // 삭제 요청의 JWT 사용자에 대해 DB의 현재 ROLE을 조회하므로 오래된 프론트 권한값에 의존하지 않습니다.
        String role = jdbcTemplate.queryForObject("SELECT role FROM users WHERE id = ?", String.class, userId);
        return "ADMIN".equals(role);
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
                .lectureId(comment.getLectureId())
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

    // Lecture.isDeleted는 Boolean이라 Comment/Post처럼 findByIdAndIsDeleted 리포지토리 메서드를 쓸 수 없다
    // (LectureServiceImpl.validateLectureExists와 동일한 방식).
    private void validateLecture(Long lectureId) {
        boolean exists = lectureRepository.findById(lectureId)
                .filter(lecture -> !lecture.getIsDeleted())
                .isPresent();
        if (!exists) {
            throw new BusinessException(ErrorCode.COURSE_NOT_FOUND);
        }
    }

    private void validateParent(Long parentCommentId, Predicate<Comment> belongsToSameTarget) {
        if (parentCommentId == null) {
            return;
        }

        Comment parent = getComment(parentCommentId);
        if (!belongsToSameTarget.test(parent)) {
            // 대댓글은 같은 게시글(또는 같은 강의)의 댓글에만 연결할 수 있다.
            throw new BusinessException(ErrorCode.COMMENT_PARENT_MISMATCH);
        }
    }
}
