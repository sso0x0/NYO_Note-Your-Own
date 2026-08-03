package com.nyo.domain.ai.repository;

import com.nyo.domain.ai.entity.AiRequestLog;
import org.springframework.data.jpa.repository.JpaRepository;

// AiRequestLog 엔티티에 대한 기본 CRUD를 제공하는 레포지토리.
public interface AiRequestLogRepository extends JpaRepository<AiRequestLog, Long> {

}