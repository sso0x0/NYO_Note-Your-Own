package com.nyo.domain.common.service;

import com.nyo.domain.common.dto.request.ViewRequest;

// 조회수 공용 서비스 (노트/게시글/강의 공용, 로그인 필수)
public interface ViewService {

    // 조회 기록 등록 후 카운트 증가 여부 반환 (항상 true, 조회할 때마다 카운트 증가)
    boolean recordView(Long userId, ViewRequest request);
}