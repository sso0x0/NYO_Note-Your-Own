package com.nyo.domain.instructor.controller;

import com.nyo.domain.instructor.dto.InstructorApplicationRequest;
import com.nyo.domain.instructor.dto.InstructorApplicationResponse;
import com.nyo.domain.instructor.service.InstructorApplicationService;
import com.nyo.global.response.ApiResponse;
import com.nyo.global.security.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

// 일반 사용자의 강사 등록 신청 제출 및 내 신청 내역 조회 API를 제공하는 컨트롤러
@RestController
@RequestMapping("/api/instructor-applications")
@RequiredArgsConstructor
public class InstructorApplicationController {

    private final InstructorApplicationService instructorApplicationService;

    // 강사 등록 신청을 접수한다
    @PostMapping
    public ApiResponse<Void> create(@Valid @RequestBody InstructorApplicationRequest request) {
        // 신청자 조작을 막기 위해 userId는 요청 본문이 아닌 JWT 로그인 정보에서 가져온다.
        instructorApplicationService.create(SecurityUtil.getCurrentUserId(), request);
        return ApiResponse.ok();
    }

    // 마이페이지 - 내 강사 신청 내역 및 심사 상태 조회
    @GetMapping("/me")
    public ApiResponse<Page<InstructorApplicationResponse>> findMy(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(instructorApplicationService.findMy(SecurityUtil.getCurrentUserId(), pageable));
    }
}
