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

    List<Comment> findByPostIdAndIsDeletedOrderByCreatedAtAsc(Long postId, Integer isDeleted);

    // 트리 조회용: 삭제된 댓글도 함께 가져와야 살아있는 대댓글이 부모 없이 유실되지 않는다.
    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);

    // 강의 댓글 트리 조회용 (postId 버전과 동일한 이유로 삭제된 댓글도 포함)
    List<Comment> findByLectureIdOrderByCreatedAtAsc(Long lectureId);

    Optional<Comment> findByIdAndIsDeleted(Long id, Integer isDeleted);

    // 관리자 댓글 관리 목록용: 이미 삭제된 댓글은 관리 대상에서 제외하고 최신순으로 페이징한다.
    Page<Comment> findByIsDeletedOrderByCreatedAtDesc(Integer isDeleted, Pageable pageable);

    // 관리자 댓글 관리 목록의 유형(게시글/강의) 필터용.
    Page<Comment> findByIsDeletedAndPostIdIsNotNullOrderByCreatedAtDesc(Integer isDeleted, Pageable pageable);

    Page<Comment> findByIsDeletedAndLectureIdIsNotNullOrderByCreatedAtDesc(Integer isDeleted, Pageable pageable);

    // 관리자 강의 관리 목록용: 강의별 댓글 개수를 한 번에 집계한다 (대댓글도 lectureId를 그대로 가지므로 함께 집계됨).
    @Query("SELECT c.lectureId, COUNT(c) FROM Comment c WHERE c.lectureId IN :lectureIds AND c.isDeleted = 0 GROUP BY c.lectureId")
    List<Object[]> countByLectureIdsGrouped(@Param("lectureIds") List<Long> lectureIds);
}
