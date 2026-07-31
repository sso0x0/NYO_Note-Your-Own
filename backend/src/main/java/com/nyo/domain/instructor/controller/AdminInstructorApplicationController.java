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

    @GetMapping
    public ApiResponse<Page<InstructorApplicationAdminResponse>> findAll(
            @RequestParam(required = false) InstructorApplicationStatus status,
            @PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.ok(instructorApplicationService.findAll(status, pageable));
    }

    @PostMapping("/{applicationId}/approve")
    public ApiResponse<Void> approve(@PathVariable Long applicationId) {
        instructorApplicationService.approve(applicationId, SecurityUtil.getCurrentUserId());
        return ApiResponse.ok();
    }

    @PostMapping("/{applicationId}/reject")
    public ApiResponse<Void> reject(@PathVariable Long applicationId,
                                     @Valid @RequestBody InstructorApplicationRejectRequest request) {
        instructorApplicationService.reject(applicationId, SecurityUtil.getCurrentUserId(), request.reason());
        return ApiResponse.ok();
    }
}
