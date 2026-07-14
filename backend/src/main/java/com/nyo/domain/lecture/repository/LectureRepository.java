package com.nyo.domain.lecture.repository;

import com.nyo.domain.lecture.entity.Lecture;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LectureRepository extends JpaRepository<Lecture, Long> {

    // 삭제되지 않은 강의 전체 조회 (페이징)
    Page<Lecture> findByIsDeletedFalse(Pageable pageable);

    // 카테고리별 삭제되지 않은 강의 조회 (페이징)
    Page<Lecture> findByCategoryIdAndIsDeletedFalse(Long categoryId, Pageable pageable);

}