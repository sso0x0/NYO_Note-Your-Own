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

// 노트(Note) 엔티티에 대한 조회/집계/카운트 갱신을 담당하는 JPA 리포지토리
public interface NoteRepository extends JpaRepository<Note, Long> {
    // 특정 시각 이후 생성된 노트 수를 센다 (통계용).
    long countByCreatedAtAfter(java.time.LocalDateTime createdAt);

    // 노트 게시판 서버 페이지네이션: 삭제되지 않은 노트만 Pageable 조건으로 조회합니다.
    Page<Note> findByIsDeleted(Integer isDeleted, Pageable pageable);

    // 메인 페이지 "인기 노트" 목록: 좋아요*5 + 조회수 가중치 점수 내림차순
    @Query(value = "select n from Note n where n.isDeleted = 0 order by (n.likeCount * 5 + n.viewCount) desc",
            countQuery = "select count(n) from Note n where n.isDeleted = 0")
    Page<Note> findPopular(Pageable pageable);

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

    // 챗봇 RAG 검색어 매칭 실패 시 폴백용: 본인이 특정 강의에서 쓴 노트를 최근 수정순으로.
    Page<Note> findByUserIdAndLectureIdAndIsDeleted(Long userId, Long lectureId, Integer isDeleted, Pageable pageable);

    // 강의별 노트 목록: 삭제되지 않은 노트만 최신순으로 조회한다.
    List<Note> findByLectureIdAndIsDeletedOrderByCreatedAtDesc(Long lectureId, Integer isDeleted);

    // 삭제되지 않은 노트만 단건 조회한다.
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

    // 태그 칩 조회는 제목·본문 검색과 섞지 않고, 실제 note_tags 매핑의 태그명이 정확히 같은 노트만 반환한다.
    @Query(
            value = """
                    select n
                    from Note n, NoteTag nt, Tag t
                    where n.id = nt.id.noteId
                      and nt.id.tagId = t.id
                      and n.isDeleted = 0
                      and lower(t.name) = lower(:tagName)
                    """,
            countQuery = """
                    select count(n)
                    from Note n, NoteTag nt, Tag t
                    where n.id = nt.id.noteId
                      and nt.id.tagId = t.id
                      and n.isDeleted = 0
                      and lower(t.name) = lower(:tagName)
                    """
    )
    Page<Note> findActiveByExactTagName(@Param("tagName") String tagName, Pageable pageable);

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
