package com.nyo.domain.common.repository;

import com.nyo.domain.common.entity.ViewLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ViewLogRepository extends JpaRepository<ViewLog, Long> {
}