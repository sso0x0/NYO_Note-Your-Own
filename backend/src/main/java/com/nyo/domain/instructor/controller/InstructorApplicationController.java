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

@RestController
@RequestMapping("/api/instructor-applications")
@RequiredArgsConstructor
public class InstructorApplicationController {

    private final InstructorApplicationService instructorApplicationService;

    @PostMapping
    public ApiResponse<Void> create(@Valid @RequestBody InstructorApplicationRequest request) {
        // 신청자 조작을 막기 위해 userId는 요청 본문이 아닌 JWT 로그인 정보에서 가져온다.
        instructorApplicationService.create(SecurityUtil.getCurrentUserId(), request);
        return ApiResponse.ok();
    }

    @GetMapping("/me")
    public ApiResponse<Page<InstructorApplicationResponse>> findMy(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(instructorApplicationService.findMy(SecurityUtil.getCurrentUserId(), pageable));
    }
}
