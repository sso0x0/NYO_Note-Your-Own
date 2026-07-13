package com.nyo.domain.admin.repository;

import com.nyo.domain.admin.entity.AdminActionLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminActionLogRepository extends JpaRepository<AdminActionLog, Long> {

    /**
     * 이 레포지토리가 어떤 엔티티를 다루는지 스스로 설명합니다.
     */
    default String introduce() {
        return "AdminActionLogRepository: 현재는 미사용 placeholder이며, "
                + "AdminActionLog 엔티티가 실제로 쓰이게 되면 기본 CRUD를 제공합니다.";
    }
}
