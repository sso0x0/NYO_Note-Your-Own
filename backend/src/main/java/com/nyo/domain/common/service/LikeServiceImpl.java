package com.nyo.domain.common.service;

import com.nyo.domain.common.dto.request.LikeRequest;
import com.nyo.domain.common.dto.response.LikeResponse;
import com.nyo.domain.common.entity.Like;
import com.nyo.domain.common.entity.TargetType;
import com.nyo.domain.common.repository.LikeRepository;
import com.nyo.domain.user.entity.User;
import com.nyo.domain.user.repository.UserRepository;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LikeServiceImpl implements LikeService {

    private final LikeRepository likeRepository;
    private final UserRepository userRepository;

    // 좋아요 등록
    @Override
    @Transactional
    public LikeResponse like(Long userId, LikeRequest request) {
        TargetType targetType = parseTargetType(request.getTargetType());

        // 이미 좋아요 눌렀는지 중복 체크 (유니크 제약 uk_like_target과 이중 방어)
        if (likeRepository.existsByUserIdAndTargetTypeAndTargetId(userId, targetType, request.getTargetId())) {
            throw new BusinessException(ErrorCode.ALREADY_LIKED);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        Like saved = likeRepository.save(Like.builder()
                .user(user)
                .targetType(targetType)
                .targetId(request.getTargetId())
                .build());

        return LikeResponse.builder()
                .id(saved.getId())
                .userId(userId)
                .targetType(saved.getTargetType().name())
                .targetId(saved.getTargetId())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    // 좋아요 취소
    @Override
    @Transactional
    public void unlike(Long userId, LikeRequest request) {
        TargetType targetType = parseTargetType(request.getTargetType());

        // 좋아요 안 누른 상태에서 취소 요청 시 에러
        if (!likeRepository.existsByUserIdAndTargetTypeAndTargetId(userId, targetType, request.getTargetId())) {
            throw new BusinessException(ErrorCode.LIKE_NOT_FOUND);
        }

        likeRepository.deleteByUserIdAndTargetTypeAndTargetId(userId, targetType, request.getTargetId());
    }

    // 좋아요 여부 확인
    @Override
    public boolean isLiked(Long userId, String targetType, Long targetId) {
        return likeRepository.existsByUserIdAndTargetTypeAndTargetId(
                userId, parseTargetType(targetType), targetId);
    }

    private TargetType parseTargetType(String targetType) {
        try {
            return TargetType.valueOf(targetType);
        } catch (IllegalArgumentException | NullPointerException e) {
            // enum 변환 오류를 500으로 보내지 않고 클라이언트 입력 오류로 변환합니다.
            throw new BusinessException(ErrorCode.TARGET_TYPE_INVALID);
        }
    }
}
