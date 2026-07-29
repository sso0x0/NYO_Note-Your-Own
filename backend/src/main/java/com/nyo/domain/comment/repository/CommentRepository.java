package com.nyo.domain.comment.repository;

import com.nyo.domain.comment.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    long countByCreatedAtAfter(java.time.LocalDateTime createdAt);

    // 게시글 삭제·복구 시 해당 게시글에 연결된 원댓글과 답글을 함께 상태 변경한다.
    List<Comment> findByPostId(Long postId);

    // 삭제된 댓글도 함께 조회해서, 답글이 남아있는 삭제된 댓글은 "삭제된 댓글입니다" 자리표시자로 보여준다.
    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);

    List<Comment> findByLectureIdOrderByCreatedAtAsc(Long lectureId);

    Optional<Comment> findByIdAndIsDeleted(Long id, Integer isDeleted);

    // 관리자 댓글 관리 목록용: 이미 삭제된 댓글은 관리 대상에서 제외하고 최신순으로 페이징한다.
    Page<Comment> findByIsDeletedOrderByCreatedAtDesc(Integer isDeleted, Pageable pageable);

    // 관리자 댓글 관리 목록의 유형(게시글/강의) 필터용.
    Page<Comment> findByIsDeletedAndPostIdIsNotNullOrderByCreatedAtDesc(Integer isDeleted, Pageable pageable);

    Page<Comment> findByIsDeletedAndLectureIdIsNotNullOrderByCreatedAtDesc(Integer isDeleted, Pageable pageable);

    // 관리자 목록에서는 삭제 여부와 관계없이 게시글/강의 댓글을 최신순으로 조회한다.
    Page<Comment> findByPostIdIsNotNullOrderByCreatedAtDesc(Pageable pageable);

    Page<Comment> findByLectureIdIsNotNullOrderByCreatedAtDesc(Pageable pageable);

    // 관리자 강의 관리 목록용: 강의별 댓글 개수를 한 번에 집계한다 (대댓글도 lectureId를 그대로 가지므로 함께 집계됨).
    @Query("SELECT c.lectureId, COUNT(c) FROM Comment c WHERE c.lectureId IN :lectureIds AND c.isDeleted = 0 GROUP BY c.lectureId")
    List<Object[]> countByLectureIdsGrouped(@Param("lectureIds") List<Long> lectureIds);



    // 💡 추가: 마이페이지 - 내가 작성한 댓글 목록 (삭제되지 않은 것만, 최신순)
    Page<Comment> findByUserIdAndIsDeletedOrderByCreatedAtDesc(Long userId, Integer isDeleted, Pageable pageable);
}
