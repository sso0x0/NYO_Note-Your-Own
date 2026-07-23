package com.nyo.domain.common.repository;

import com.nyo.domain.common.entity.Like;
import com.nyo.domain.common.entity.TargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LikeRepository extends JpaRepository<Like, Long> {

    // 특정 유저가 특정 대상에 좋아요를 눌렀는지 여부 확인 (중복 방지용)
    boolean existsByUserIdAndTargetTypeAndTargetId(Long userId, TargetType targetType, Long targetId);

    // 마이페이지 - 내가 좋아요한 대상(노트 등) 목록을 좋아요 누른 순서로 페이징 조회
    Page<Like> findByUserIdAndTargetType(Long userId, TargetType targetType, Pageable pageable);

    // 특정 유저의 특정 대상 좋아요 취소 (레코드 삭제)
    void deleteByUserIdAndTargetTypeAndTargetId(Long userId, TargetType targetType, Long targetId);

    // 특정 대상(강의 등)에 걸린 레코드 전체 삭제 (대상 삭제 시 정리용)
    void deleteByTargetTypeAndTargetId(TargetType targetType, Long targetId);
}