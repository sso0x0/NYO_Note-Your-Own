package com.nyo.domain.user.repository;

import com.nyo.domain.user.entity.UserSanction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserSanctionRepository extends JpaRepository<UserSanction, Long> {

    // 💡 특정 회원의 제재 이력을 최신순으로 조회 (관리자가 이력 확인할 때 사용)
    List<UserSanction> findByUserIdOrderByCreatedAtDesc(Long userId);
}