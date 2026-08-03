package com.nyo.domain.common.repository;

import com.nyo.domain.common.entity.ViewLog;
import org.springframework.data.jpa.repository.JpaRepository;

// 조회 로그 저장용 Repository (커스텀 메서드 없이 기본 CRUD만 사용)
public interface ViewLogRepository extends JpaRepository<ViewLog, Long> {
}