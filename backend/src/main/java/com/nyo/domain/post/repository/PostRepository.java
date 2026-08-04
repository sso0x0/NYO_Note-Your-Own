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

// 커뮤니티 게시글(Post) 조회/집계를 위한 레포지토리.
public interface PostRepository extends JpaRepository<Post, Long> {
    // 특정 시점 이후 생성된 게시글 수를 센다 (통계용).
    long countByCreatedAtAfter(java.time.LocalDateTime createdAt);

    // 삭제 여부로 게시글을 최신순으로 조회한다.
    List<Post> findByIsDeletedOrderByCreatedAtDesc(Integer isDeleted);

    // 커뮤니티 서버 페이지네이션: 삭제되지 않은 게시글만 DB 단계에서 페이지 단위로 조회한다.
    Page<Post> findByIsDeleted(Integer isDeleted, Pageable pageable);

    // 공지 분리 조회: 일반 페이지와 공지 전용 페이지가 서로 섞이지 않게 조회한다.
    Page<Post> findByIsDeletedAndIsNotice(Integer isDeleted, Integer isNotice, Pageable pageable);

    // 메인 페이지 "커뮤니티" 인기 목록: 좋아요*5 + 조회수 가중치 점수 내림차순 (공지 제외)
    @Query(value = "select p from Post p where p.isDeleted = 0 and p.isNotice = 0 order by (p.likeCount * 5 + p.viewCount) desc",
            countQuery = "select count(p) from Post p where p.isDeleted = 0 and p.isNotice = 0")
    Page<Post> findPopular(Pageable pageable);

    Optional<Post> findByIdAndIsDeleted(Long id, Integer isDeleted);

    // 검색 색인(Elasticsearch)이 반환한 id 목록으로 실제 게시글 데이터를 한 번에 조회한다.
    List<Post> findAllByIdInAndIsDeleted(List<Long> ids, Integer isDeleted);

    // 작성자 닉네임과 일치한 사용자들의 일반 게시글을 조회한다.
    Page<Post> findByUserIdInAndIsDeletedAndIsNotice(
            List<Long> userIds, Integer isDeleted, Integer isNotice, Pageable pageable);

    // 마이페이지 - 내가 작성한 게시글 목록
    Page<Post> findByUserIdAndIsDeleted(Long userId, Integer isDeleted, Pageable pageable);

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
