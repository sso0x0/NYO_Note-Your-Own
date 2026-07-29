package com.nyo.domain.note.repository;

import com.nyo.domain.note.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {
    long countByCreatedAtAfter(java.time.LocalDateTime createdAt);

    // 노트 게시판 서버 페이지네이션: 삭제되지 않은 노트만 Pageable 조건으로 조회합니다.
    Page<Note> findByIsDeleted(Integer isDeleted, Pageable pageable);

    // 노트의 lectureId와 강의의 categoryId를 연결해 선택한 강의 카테고리의 노트만 조회한다.
    @Query(
            value = """
                    select n
                    from Note n, Lecture l
                    where n.lectureId = l.id
                      and l.category.id = :categoryId
                      and n.isDeleted = 0
                      and l.isDeleted = false
                    """,
            countQuery = """
                    select count(n)
                    from Note n, Lecture l
                    where n.lectureId = l.id
                      and l.category.id = :categoryId
                      and n.isDeleted = 0
                      and l.isDeleted = false
                    """
    )
    Page<Note> findByLectureCategoryId(@Param("categoryId") Long categoryId, Pageable pageable);

    // 마이페이지 - 내가 작성한 노트 목록
    Page<Note> findByUserIdAndIsDeleted(Long userId, Integer isDeleted, Pageable pageable);

    List<Note> findByLectureIdAndIsDeletedOrderByCreatedAtDesc(Long lectureId, Integer isDeleted);

    Optional<Note> findByIdAndIsDeleted(Long id, Integer isDeleted);

    // 검색 색인(Elasticsearch)이 반환한 id 목록으로 실제 노트 데이터를 한 번에 조회한다.
    List<Note> findAllByIdInAndIsDeleted(List<Long> ids, Integer isDeleted);

    // Elasticsearch 색인이 누락된 노트도 찾을 수 있도록 제목을 DB에서 보조 검색한다.
    // Oracle CLOB인 content에는 lower/like JPQL을 적용할 수 없어 DB 보조 검색에서 제외한다.
    @Query("""
            select n
            from Note n
            where n.isDeleted = 0
              and lower(n.title) like lower(concat('%', :keyword, '%'))
            """)
    Page<Note> searchActiveByKeyword(@Param("keyword") String keyword, Pageable pageable);

    // 닉네임과 일치한 사용자 ID 목록으로 삭제되지 않은 노트를 조회한다.
    Page<Note> findByUserIdInAndIsDeleted(List<Long> userIds, Integer isDeleted, Pageable pageable);

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

    // 관리자 강의 관리 목록용: 강의별 노트 개수를 한 번에 집계한다 (결과 각 행은 [lectureId, count]).
    @Query("SELECT n.lectureId, COUNT(n) FROM Note n WHERE n.lectureId IN :lectureIds AND n.isDeleted = 0 GROUP BY n.lectureId")
    List<Object[]> countByLectureIdsGrouped(@Param("lectureIds") List<Long> lectureIds);
}
