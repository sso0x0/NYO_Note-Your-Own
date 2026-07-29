package com.nyo.domain.report.controller;

import com.nyo.domain.report.dto.ReportAdminResponse;
import com.nyo.domain.report.entity.ReportTargetType;
import com.nyo.domain.report.service.ReportService;
import com.nyo.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final ReportService reportService;

    @GetMapping
    public ApiResponse<Page<ReportAdminResponse>> findAll(
            @RequestParam(required = false) ReportTargetType targetType,
            @PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.ok(reportService.findAll(targetType, pageable));
    }

    @PostMapping("/{reportId}/review")
    public ApiResponse<Void> markReviewed(@PathVariable Long reportId) {
        reportService.markReviewed(reportId);
        return ApiResponse.ok();
    }
}
