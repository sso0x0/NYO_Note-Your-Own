package com.nyo.domain.admin.repository;

import com.nyo.domain.admin.entity.AdminActionLog;
import org.springframework.data.jpa.repository.JpaRepository;

// AdminActionLog 엔티티에 대한 기본 CRUD를 제공하는 레포지토리
public interface AdminActionLogRepository extends JpaRepository<AdminActionLog, Long> {

}
