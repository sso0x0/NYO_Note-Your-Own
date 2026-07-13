package com.nyo.domain.common.repository;

import com.nyo.domain.common.entity.Like;
import com.nyo.domain.common.entity.TargetType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LikeRepository extends JpaRepository<Like, Long> {

    // 특정 유저가 특정 대상에 좋아요를 눌렀는지 여부 확인 (중복 방지용)
    boolean existsByUserIdAndTargetTypeAndTargetId(Long userId, TargetType targetType, Long targetId);

    // 특정 유저의 특정 대상 좋아요 취소 (레코드 삭제)
    void deleteByUserIdAndTargetTypeAndTargetId(Long userId, TargetType targetType, Long targetId);
}