package com.nyo.domain.post.repository;

import com.nyo.domain.post.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByIsDeletedOrderByCreatedAtDesc(Integer isDeleted);

    // 커뮤니티 서버 페이지네이션: 삭제되지 않은 게시글만 DB 단계에서 페이지 단위로 조회한다.
    Page<Post> findByIsDeleted(Integer isDeleted, Pageable pageable);

    // 공지 분리 조회: 일반 페이지와 공지 전용 페이지가 서로 섞이지 않게 조회한다.
    Page<Post> findByIsDeletedAndIsNotice(Integer isDeleted, Integer isNotice, Pageable pageable);

    Optional<Post> findByIdAndIsDeleted(Long id, Integer isDeleted);

    // 조회수만 직접 증가시켜 BaseEntity.updatedAt이 바뀌지 않게 한다.
    @Modifying
    @Query("update Post p set p.viewCount = p.viewCount + 1 where p.id = :id and p.isDeleted = 0")
    void increaseViewCountOnly(@Param("id") Long id);

    // 좋아요 수만 직접 증가시켜 최종 수정일에는 영향을 주지 않는다.
    @Modifying
    @Query("update Post p set p.likeCount = p.likeCount + 1 where p.id = :id and p.isDeleted = 0")
    void increaseLikeCountOnly(@Param("id") Long id);

    // 좋아요 수만 직접 감소시켜 최종 수정일에는 영향을 주지 않는다.
    @Modifying
    @Query("update Post p set p.likeCount = p.likeCount - 1 where p.id = :id and p.isDeleted = 0 and p.likeCount > 0")
    void decreaseLikeCountOnly(@Param("id") Long id);
}
