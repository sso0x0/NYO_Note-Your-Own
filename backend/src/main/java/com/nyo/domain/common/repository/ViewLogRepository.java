package com.nyo.domain.common.repository;

import com.nyo.domain.common.entity.TargetType;
import com.nyo.domain.common.entity.ViewLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface ViewLogRepository extends JpaRepository<ViewLog, Long> {

    // 유저의 당일 조회 여부 확인 (중복 방지용)
    boolean existsByTargetTypeAndTargetIdAndViewedDateAndUserId(
            TargetType targetType, Long targetId, LocalDate viewedDate, Long userId);
}