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

    // recordDate는 startedAt의 날짜 부분(PomodoroRecord 생성 시 자동 계산)이라 여기서 바로 범위 검색 가능
    Page<PomodoroRecord> findByUserIdAndRecordDateBetween(
            Long userId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    // endedAt is not null: 완료된 세션만 집계 (진행 중인 타이머의 focusMinutes는 아직 실제로 채운 시간이 아님)
    // coalesce(...,0): 해당 조건에 매칭되는 기록이 하나도 없으면 sum이 null이 되므로 0으로 대체
    @Query("select coalesce(sum(p.focusMinutes), 0) from PomodoroRecord p "
            + "where p.userId = :userId and p.recordDate = :recordDate and p.endedAt is not null")
    Integer sumFocusMinutesByUserIdAndRecordDate(@Param("userId") Long userId, @Param("recordDate") LocalDate recordDate);

    @Query("select coalesce(sum(p.focusMinutes), 0) from PomodoroRecord p "
            + "where p.userId = :userId and p.endedAt is not null")
    Integer sumFocusMinutesByUserId(@Param("userId") Long userId);
}
