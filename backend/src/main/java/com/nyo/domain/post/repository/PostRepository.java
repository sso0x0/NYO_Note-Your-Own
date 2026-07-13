package com.nyo.domain.post.repository;

import com.nyo.domain.post.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByIsDeletedOrderByCreatedAtDesc(Integer isDeleted);

    Optional<Post> findByIdAndIsDeleted(Long id, Integer isDeleted);
}
