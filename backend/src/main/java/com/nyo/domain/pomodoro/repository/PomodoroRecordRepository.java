package com.nyo.domain.pomodoro.repository;

import com.nyo.domain.pomodoro.entity.PomodoroRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PomodoroRecordRepository extends JpaRepository<PomodoroRecord, Long> {

    Page<PomodoroRecord> findByUserId(Long userId, Pageable pageable);
}
