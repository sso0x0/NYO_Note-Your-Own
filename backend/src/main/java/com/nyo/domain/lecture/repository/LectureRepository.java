package com.nyo.domain.lecture.repository;

import com.nyo.domain.lecture.entity.Lecture;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LectureRepository extends JpaRepository<Lecture, Long> {

    // 삭제되지 않은 강의 전체 조회 (페이징)
    Page<Lecture> findByIsDeletedFalse(Pageable pageable);

    // 카테고리별 삭제되지 않은 강의 조회 (페이징)
    Page<Lecture> findByCategoryIdAndIsDeletedFalse(Long categoryId, Pageable pageable);

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

}