package com.nyo.domain.post.repository;

import com.nyo.domain.post.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    /**
     * 이 레포지토리가 어떤 엔티티를 다루는지 스스로 설명합니다.
     */
    default String introduce() {
        return "PostRepository: Post 엔티티에 대한 기본 CRUD를 제공합니다. (구현 예정)";
    }
}
