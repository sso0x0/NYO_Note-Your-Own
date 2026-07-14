package com.nyo.domain.common.service;

import com.nyo.domain.common.dto.request.LikeRequest;
import com.nyo.domain.common.dto.response.LikeResponse;

// 좋아요 공용 서비스 (노트/게시글/강의 공용, userId는 인증 정보에서 추출)
public interface LikeService {

    // 좋아요 등록
    LikeResponse like(Long userId, LikeRequest request);

    // 좋아요 취소
    void unlike(Long userId, LikeRequest request);

    // 좋아요 여부 확인 (상세 조회 시 하트 아이콘 표시 등에 사용)
    boolean isLiked(Long userId, String targetType, Long targetId);
}