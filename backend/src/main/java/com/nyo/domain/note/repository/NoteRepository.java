package com.nyo.domain.note.repository;

import com.nyo.domain.note.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByIsDeletedOrderByCreatedAtDesc(Integer isDeleted);

    List<Note> findByLectureIdAndIsDeletedOrderByCreatedAtDesc(Long lectureId, Integer isDeleted);

    Optional<Note> findByIdAndIsDeleted(Long id, Integer isDeleted);

    // 조회수만 직접 증가시켜 BaseEntity.updatedAt이 바뀌지 않게 한다.
    @Modifying
    @Query("update Note n set n.viewCount = n.viewCount + 1 where n.id = :id and n.isDeleted = 0")
    void increaseViewCountOnly(@Param("id") Long id);

    // 좋아요 수만 직접 증가시켜 최종 수정일에는 영향을 주지 않는다.
    @Modifying
    @Query("update Note n set n.likeCount = n.likeCount + 1 where n.id = :id and n.isDeleted = 0")
    void increaseLikeCountOnly(@Param("id") Long id);

    // 좋아요 수만 직접 감소시켜 최종 수정일에는 영향을 주지 않는다.
    @Modifying
    @Query("update Note n set n.likeCount = n.likeCount - 1 where n.id = :id and n.isDeleted = 0 and n.likeCount > 0")
    void decreaseLikeCountOnly(@Param("id") Long id);
}
