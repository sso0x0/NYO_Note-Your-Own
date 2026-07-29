package com.nyo.domain.report.controller;

import com.nyo.domain.report.dto.ReportRequest;
import com.nyo.domain.report.service.ReportService;
import com.nyo.global.response.ApiResponse;
import com.nyo.global.security.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ApiResponse<Void> create(@Valid @RequestBody ReportRequest request) {
        // 신고자 조작을 막기 위해 reporterId는 요청 본문이 아닌 JWT 로그인 정보에서 가져온다.
        reportService.create(SecurityUtil.getCurrentUserId(), request);
        return ApiResponse.ok();
    }
}
