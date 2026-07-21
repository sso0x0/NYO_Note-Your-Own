package com.nyo.domain.user.repository;

import com.nyo.domain.user.entity.UserSanction;
import com.nyo.global.enums.SanctionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/** 회원 제재 이력(UserSanction) 조회용 리포지토리. 관리자 제재 이력 조회 + 정지 자동 해제 판단에 사용. */
@Repository
public interface UserSanctionRepository extends JpaRepository<UserSanction, Long> {

    // 💡 특정 회원의 제재 이력을 최신순으로 조회 (관리자가 이력 확인할 때 사용)
    List<UserSanction> findByUserIdOrderByCreatedAtDesc(Long userId);

    // 정지 해제 여부 판단용: 가장 최근에 등록된 정지 건 하나만 조회
    Optional<UserSanction> findTopByUserIdAndTypeOrderByCreatedAtDesc(Long userId, SanctionType type);
}