package com.nyo.domain.instructor.repository;

import com.nyo.domain.instructor.entity.InstructorApplication;
import com.nyo.domain.instructor.entity.InstructorApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InstructorApplicationRepository extends JpaRepository<InstructorApplication, Long> {

    boolean existsByUserIdAndStatus(Long userId, InstructorApplicationStatus status);

    Page<InstructorApplication> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<InstructorApplication> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<InstructorApplication> findByStatusOrderByCreatedAtDesc(InstructorApplicationStatus status, Pageable pageable);
}
