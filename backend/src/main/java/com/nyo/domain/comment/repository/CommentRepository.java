package com.nyo.domain.comment.repository;

import com.nyo.domain.comment.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdAndIsDeletedOrderByCreatedAtAsc(Long postId, Integer isDeleted);

    Optional<Comment> findByIdAndIsDeleted(Long id, Integer isDeleted);
}
