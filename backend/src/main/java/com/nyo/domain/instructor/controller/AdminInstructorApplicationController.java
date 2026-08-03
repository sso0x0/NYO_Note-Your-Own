package com.nyo.domain.instructor.controller;

import com.nyo.domain.instructor.dto.InstructorApplicationAdminResponse;
import com.nyo.domain.instructor.dto.InstructorApplicationRejectRequest;
import com.nyo.domain.instructor.entity.InstructorApplicationStatus;
import com.nyo.domain.instructor.service.InstructorApplicationService;
import com.nyo.global.response.ApiResponse;
import com.nyo.global.security.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

/**
 * 관리자 전용 강사 신청 심사 API. SecurityConfig에서 "/api/admin/**" → hasRole("ADMIN")으로 보호되므로
 * 여기 메서드들은 인증/권한 체크를 따로 하지 않는다 (필터 단에서 이미 걸러짐).
 */
@RestController
@RequestMapping("/api/admin/instructor-applications")
@RequiredArgsConstructor
public class AdminInstructorApplicationController {

    private final InstructorApplicationService instructorApplicationService;

    // 강사 신청 목록 조회 (status로 대기/승인/반려 필터링 가능)
    @GetMapping
    public ApiResponse<Page<InstructorApplicationAdminResponse>> findAll(
            @RequestParam(required = false) InstructorApplicationStatus status,
            @PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.ok(instructorApplicationService.findAll(status, pageable));
    }

    // 강사 신청 승인: 신청자 권한을 INSTRUCTOR로 승격시킨다.
    @PostMapping("/{applicationId}/approve")
    public ApiResponse<Void> approve(@PathVariable Long applicationId) {
        instructorApplicationService.approve(applicationId, SecurityUtil.getCurrentUserId());
        return ApiResponse.ok();
    }

    // 강사 신청 반려: 사유를 남기고 신청 상태만 변경한다 (권한 변경 없음).
    @PostMapping("/{applicationId}/reject")
    public ApiResponse<Void> reject(@PathVariable Long applicationId,
                                     @Valid @RequestBody InstructorApplicationRejectRequest request) {
        instructorApplicationService.reject(applicationId, SecurityUtil.getCurrentUserId(), request.reason());
        return ApiResponse.ok();
    }
}
