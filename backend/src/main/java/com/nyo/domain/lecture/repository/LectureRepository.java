package com.nyo.domain.lecture.repository;

import com.nyo.domain.lecture.entity.Lecture;
import com.nyo.domain.lecture.entity.LectureStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// 강의(Lecture)에 대한 CRUD 및 다양한 조회/집계 쿼리를 담당하는 레포지토리
public interface LectureRepository extends JpaRepository<Lecture, Long> {

    // 노트 임시 연결에는 강의 ID만 필요하므로 엔티티 전체 컬럼을 조회하지 않는다.
    // 현재 DB에 아직 없는 Lecture 신규 컬럼이 있어도 노트 저장이 실패하지 않게 하는 임시 호환 쿼리다.
    @Query(value = "SELECT id FROM lectures WHERE is_deleted = 0 ORDER BY id FETCH FIRST 1 ROWS ONLY",
            nativeQuery = true)
    Optional<Long> findFirstActiveLectureId();

    // 강의 시청 화면에서 전달한 ID가 실제 활성 강의인지 엔티티 전체 조회 없이 확인한다.
    @Query(value = "SELECT id FROM lectures WHERE id = :lectureId AND is_deleted = 0",
            nativeQuery = true)
    Optional<Long> findActiveLectureIdById(@Param("lectureId") Long lectureId);

    // 노트 상세 화면에는 강의 ID 대신 제목을 보여주므로 제목 한 컬럼만 조회한다.
    @Query(value = "SELECT title FROM lectures WHERE id = :lectureId AND is_deleted = 0",
            nativeQuery = true)
    Optional<String> findActiveLectureTitleById(@Param("lectureId") Long lectureId);

    // 챗봇이 강의 정보(제목/설명/강사)를 컨텍스트로 쓰기 위한 조회.
    Optional<Lecture> findByIdAndIsDeletedFalse(Long id);

    // 삭제된 강의 제외, 강의 전체 조회 (페이징, category 즉시 로딩으로 N+1 방지)
    // 관리자 목록(심사 대기/반려 포함 전체 확인용)에서 쓰므로 심사 상태와 무관하게 전부 내려준다.
    @Query(value = "SELECT l FROM Lecture l JOIN FETCH l.category WHERE l.isDeleted = false",
            countQuery = "SELECT count(l) FROM Lecture l WHERE l.isDeleted = false")
    Page<Lecture> findByIsDeletedFalse(Pageable pageable);

    // 관리자 강의 관리 목록용: 삭제된 강의도 함께 내려줘 화면에서 삭제 내역을 확인하고 복구할 수 있게 한다.
    // 심사 대기중(PENDING)인 신청 건을 맨 위로 올려 관리자가 바로 확인할 수 있게 정렬한다.
    @Query(value = "SELECT l FROM Lecture l JOIN FETCH l.category "
            + "ORDER BY CASE WHEN l.status = com.nyo.domain.lecture.entity.LectureStatus.PENDING THEN 0 ELSE 1 END, l.createdAt DESC",
            countQuery = "SELECT count(l) FROM Lecture l")
    Page<Lecture> findAllForAdmin(Pageable pageable);

    // 관리자 강의 관리 목록: 심사 상태 필터 (삭제 여부 무관)
    @Query(value = "SELECT l FROM Lecture l JOIN FETCH l.category WHERE l.status = :status",
            countQuery = "SELECT count(l) FROM Lecture l WHERE l.status = :status")
    Page<Lecture> findByStatusForAdmin(@Param("status") LectureStatus status, Pageable pageable);

    // 관리자 강의 관리 목록: 카테고리 필터 (삭제 여부 무관). 전체 목록과 동일하게 PENDING 신청 건을 맨 위로 정렬한다.
    @Query(value = "SELECT l FROM Lecture l JOIN FETCH l.category WHERE l.category.id = :categoryId "
            + "ORDER BY CASE WHEN l.status = com.nyo.domain.lecture.entity.LectureStatus.PENDING THEN 0 ELSE 1 END, l.createdAt DESC",
            countQuery = "SELECT count(l) FROM Lecture l WHERE l.category.id = :categoryId")
    Page<Lecture> findByCategoryIdForAdmin(@Param("categoryId") Long categoryId, Pageable pageable);

    // 관리자 강의 관리 목록: 카테고리 + 심사 상태 필터 (삭제 여부 무관)
    @Query(value = "SELECT l FROM Lecture l JOIN FETCH l.category WHERE l.category.id = :categoryId AND l.status = :status",
            countQuery = "SELECT count(l) FROM Lecture l WHERE l.category.id = :categoryId AND l.status = :status")
    Page<Lecture> findByCategoryIdAndStatusForAdmin(
            @Param("categoryId") Long categoryId, @Param("status") LectureStatus status, Pageable pageable);

    // 일반 회원용 전체 목록: 승인된(APPROVED) 강의만 노출한다 (강사 등록 신청 중/반려된 강의는 숨김).
    @Query(value = "SELECT l FROM Lecture l JOIN FETCH l.category WHERE l.isDeleted = false AND l.status = :status",
            countQuery = "SELECT count(l) FROM Lecture l WHERE l.isDeleted = false AND l.status = :status")
    Page<Lecture> findByIsDeletedFalseAndStatus(@Param("status") LectureStatus status, Pageable pageable);

    // 카테고리별 강의 조회 (페이징, category 즉시 로딩으로 N+1 방지)
    @Query(value = "SELECT l FROM Lecture l JOIN FETCH l.category WHERE l.category.id = :categoryId AND l.isDeleted = false",
            countQuery = "SELECT count(l) FROM Lecture l WHERE l.category.id = :categoryId AND l.isDeleted = false") // 삭제된 강의 제외
    Page<Lecture> findByCategoryIdAndIsDeletedFalse(@Param("categoryId") Long categoryId, Pageable pageable);

    // 카테고리별 일반 회원용 목록: 승인된 강의만 노출한다.
    @Query(value = "SELECT l FROM Lecture l JOIN FETCH l.category WHERE l.category.id = :categoryId AND l.isDeleted = false AND l.status = :status",
            countQuery = "SELECT count(l) FROM Lecture l WHERE l.category.id = :categoryId AND l.isDeleted = false AND l.status = :status")
    Page<Lecture> findByCategoryIdAndIsDeletedFalseAndStatus(
            @Param("categoryId") Long categoryId, @Param("status") LectureStatus status, Pageable pageable);

    // 강사 본인의 강의 등록 신청 내역 (마이페이지 "강의 등록" 탭). 삭제 여부와 무관하게 심사 상태를 모두 보여준다.
    @Query(value = "SELECT l FROM Lecture l JOIN FETCH l.category WHERE l.createdBy.id = :userId ORDER BY l.createdAt DESC",
            countQuery = "SELECT count(l) FROM Lecture l WHERE l.createdBy.id = :userId")
    Page<Lecture> findByCreatedByIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);

    // Elasticsearch 검색 결과(id 목록)에 해당하는 강의만 조회 (category 즉시 로딩, 삭제된 강의 제외)
    @Query("SELECT l FROM Lecture l JOIN FETCH l.category WHERE l.id IN :ids AND l.isDeleted = false")
    List<Lecture> findAllByIdInAndIsDeletedFalse(@Param("ids") List<Long> ids);

    // 좋아요수/조회수 기준 상위 강의 조회 (인기 강의 배치용, category 즉시 로딩으로 N+1 방지)
    @Query(value = "SELECT l FROM Lecture l JOIN FETCH l.category WHERE l.isDeleted = false "
            + "ORDER BY l.likeCount DESC, l.viewCount DESC")
    List<Lecture> findByIsDeletedFalseOrderByLikeCountDescViewCountDesc(Pageable pageable);

    // 메인 페이지 "인기 강의" 목록: 좋아요*5 + 조회수 가중치 점수 내림차순 (승인된 강의만)
    @Query(value = "SELECT l FROM Lecture l JOIN FETCH l.category WHERE l.isDeleted = false AND l.status = :status "
            + "ORDER BY (l.likeCount * 5 + l.viewCount) DESC",
            countQuery = "SELECT count(l) FROM Lecture l WHERE l.isDeleted = false AND l.status = :status")
    Page<Lecture> findPopularByStatus(@Param("status") LectureStatus status, Pageable pageable);

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
