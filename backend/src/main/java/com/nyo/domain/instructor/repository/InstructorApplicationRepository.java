package com.nyo.domain.instructor.repository;

import com.nyo.domain.instructor.entity.InstructorApplication;
import com.nyo.domain.instructor.entity.InstructorApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

// 강사 등록 신청(InstructorApplication) 엔티티에 대한 조회를 담당하는 JPA 리포지토리
public interface InstructorApplicationRepository extends JpaRepository<InstructorApplication, Long> {

    // 특정 사용자가 해당 상태의 신청서를 이미 가지고 있는지 확인한다 (중복 신청 방지용).
    boolean existsByUserIdAndStatus(Long userId, InstructorApplicationStatus status);

    // 특정 사용자의 신청 내역을 최신순으로 조회한다.
    Page<InstructorApplication> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // 전체 신청 내역을 최신순으로 조회한다.
    Page<InstructorApplication> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // 특정 상태의 신청 내역만 최신순으로 조회한다.
    Page<InstructorApplication> findByStatusOrderByCreatedAtDesc(InstructorApplicationStatus status, Pageable pageable);
}
