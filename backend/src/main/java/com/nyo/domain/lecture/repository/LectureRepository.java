package com.nyo.domain.lecture.repository;

import com.nyo.domain.lecture.entity.Lecture;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LectureRepository extends JpaRepository<Lecture, Long> {

    // 노트 임시 연결에는 강의 ID만 필요하므로 엔티티 전체 컬럼을 조회하지 않는다.
    // 현재 DB에 아직 없는 Lecture 신규 컬럼이 있어도 노트 저장이 실패하지 않게 하는 임시 호환 쿼리다.
    @Query(value = "SELECT id FROM lectures WHERE is_deleted = 0 ORDER BY id FETCH FIRST 1 ROWS ONLY",
            nativeQuery = true)
    Optional<Long> findFirstActiveLectureId();

    // 삭제된 강의 제외, 강의 전체 조회 (페이징, category 즉시 로딩으로 N+1 방지)
    @Query(value = "SELECT l FROM Lecture l JOIN FETCH l.category WHERE l.isDeleted = false",
            countQuery = "SELECT count(l) FROM Lecture l WHERE l.isDeleted = false")
    Page<Lecture> findByIsDeletedFalse(Pageable pageable);

    // 카테고리별 강의 조회 (페이징, category 즉시 로딩으로 N+1 방지)
    @Query(value = "SELECT l FROM Lecture l JOIN FETCH l.category WHERE l.category.id = :categoryId AND l.isDeleted = false",
            countQuery = "SELECT count(l) FROM Lecture l WHERE l.category.id = :categoryId AND l.isDeleted = false") // 삭제된 강의 제외
    Page<Lecture> findByCategoryIdAndIsDeletedFalse(@Param("categoryId") Long categoryId, Pageable pageable);

    // Elasticsearch 검색 결과(id 목록)에 해당하는 강의만 조회 (category 즉시 로딩, 삭제된 강의 제외)
    @Query("SELECT l FROM Lecture l JOIN FETCH l.category WHERE l.id IN :ids AND l.isDeleted = false")
    List<Lecture> findAllByIdInAndIsDeletedFalse(@Param("ids") List<Long> ids);

    // 좋아요수/조회수 기준 상위 강의 조회 (인기 강의 배치용)
    List<Lecture> findByIsDeletedFalseOrderByLikeCountDescViewCountDesc(Pageable pageable);

    // 인기 강의 플래그 전체 초기화 (배치 갱신 시작 전 호출)
    @Modifying
    @Query("UPDATE Lecture l SET l.isPopular = false WHERE l.isPopular = true")
    void clearPopularStatus();

    // 지정한 id들만 인기 강의로 표시
    @Modifying
    @Query("UPDATE Lecture l SET l.isPopular = true WHERE l.id IN :ids")
    void markPopular(List<Long> ids);

    // 조회수 원자 증가 (동시 요청 시 카운트 유실 방지)
    @Modifying
    @Query("UPDATE Lecture l SET l.viewCount = l.viewCount + 1 WHERE l.id = :id")
    void increaseViewCount(@Param("id") Long id);

    // 좋아요수 원자 증가
    @Modifying
    @Query("UPDATE Lecture l SET l.likeCount = l.likeCount + 1 WHERE l.id = :id")
    void increaseLikeCount(@Param("id") Long id);

    // 좋아요수 원자 감소 (0 미만으로 내려가지 않도록 조건 포함)
    @Modifying
    @Query("UPDATE Lecture l SET l.likeCount = l.likeCount - 1 WHERE l.id = :id AND l.likeCount > 0")
    void decreaseLikeCount(@Param("id") Long id);

    // 정원 여유가 있을 때만 등록 인원 원자 증가 (반환값 0이면 정원 마감으로 처리)
    @Modifying
    @Query("UPDATE Lecture l SET l.currentEnrolled = l.currentEnrolled + 1 "
            + "WHERE l.id = :id AND (l.capacity IS NULL OR l.currentEnrolled < l.capacity)")
    int enrollIfAvailable(@Param("id") Long id);

    // 등록 인원 원자 감소 (0 미만으로 내려가지 않도록 조건 포함)
    @Modifying
    @Query("UPDATE Lecture l SET l.currentEnrolled = l.currentEnrolled - 1 WHERE l.id = :id AND l.currentEnrolled > 0")
    void decreaseEnrolledCount(@Param("id") Long id);

}
