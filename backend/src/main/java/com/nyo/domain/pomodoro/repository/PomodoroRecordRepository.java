package com.nyo.domain.pomodoro.repository;

import com.nyo.domain.pomodoro.entity.PomodoroRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface PomodoroRecordRepository extends JpaRepository<PomodoroRecord, Long> {

    Page<PomodoroRecord> findByUserId(Long userId, Pageable pageable);

    Page<PomodoroRecord> findByUserIdAndRecordDateBetween(
            Long userId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    @Query("select coalesce(sum(p.focusMinutes), 0) from PomodoroRecord p "
            + "where p.userId = :userId and p.recordDate = :recordDate and p.endedAt is not null")
    Integer sumFocusMinutesByUserIdAndRecordDate(@Param("userId") Long userId, @Param("recordDate") LocalDate recordDate);

    @Query("select coalesce(sum(p.focusMinutes), 0) from PomodoroRecord p "
            + "where p.userId = :userId and p.endedAt is not null")
    Integer sumFocusMinutesByUserId(@Param("userId") Long userId);
}
