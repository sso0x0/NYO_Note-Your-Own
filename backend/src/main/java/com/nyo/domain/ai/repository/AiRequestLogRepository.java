package com.nyo.domain.ai.repository;

import com.nyo.domain.ai.entity.AiRequestLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiRequestLogRepository extends JpaRepository<AiRequestLog, Long> {

    /**
     * 이 레포지토리가 어떤 엔티티를 다루는지 스스로 설명합니다.
     */
    default String introduce() {
        return "AiRequestLogRepository: 현재는 미사용 placeholder이며, "
                + "AiRequestLog 엔티티가 실제로 쓰이게 되면 기본 CRUD를 제공합니다.";
    }
}
