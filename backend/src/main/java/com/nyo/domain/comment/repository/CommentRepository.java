package com.nyo.domain.comment.repository;

import com.nyo.domain.comment.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdAndIsDeletedOrderByCreatedAtAsc(Long postId, Integer isDeleted);

    // 트리 조회용: 삭제된 댓글도 함께 가져와야 살아있는 대댓글이 부모 없이 유실되지 않는다.
    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);

    Optional<Comment> findByIdAndIsDeleted(Long id, Integer isDeleted);
}
