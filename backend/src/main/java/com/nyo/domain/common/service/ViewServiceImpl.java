package com.nyo.domain.common.service;

import com.nyo.domain.common.dto.request.ViewRequest;
import com.nyo.domain.common.entity.TargetType;
import com.nyo.domain.common.entity.ViewLog;
import com.nyo.domain.common.repository.ViewLogRepository;
import com.nyo.domain.user.entity.User;
import com.nyo.domain.user.repository.UserRepository;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ViewServiceImpl implements ViewService {

    private final ViewLogRepository viewLogRepository;
    private final UserRepository userRepository;

    // 조회 기록 등록 (하루 1회 제한, 이미 조회했으면 카운트 증가 없이 false 반환)
    @Override
    @Transactional
    public boolean recordView(Long userId, ViewRequest request) {
        TargetType targetType = TargetType.valueOf(request.getTargetType());
        LocalDate today = LocalDate.now();

        boolean alreadyViewed = viewLogRepository.existsByTargetTypeAndTargetIdAndViewedDateAndUserId(
                targetType, request.getTargetId(), today, userId);
        if (alreadyViewed) {
            return false;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        viewLogRepository.save(ViewLog.builder()
                .user(user)
                .targetType(targetType)
                .targetId(request.getTargetId())
                .viewedDate(today)
                .build());
        return true;
    }
}