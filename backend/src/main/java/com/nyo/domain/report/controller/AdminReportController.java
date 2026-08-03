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

// 관리자 전용 신고 목록 조회 및 확인 처리 API를 제공하는 컨트롤러
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final ReportService reportService;

    // 신고 목록 조회 (targetType으로 노트/게시글/댓글 필터링 가능)
    @GetMapping
    public ApiResponse<Page<ReportAdminResponse>> findAll(
            @RequestParam(required = false) ReportTargetType targetType,
            @PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.ok(reportService.findAll(targetType, pageable));
    }

    // 신고 확인 처리: 상태만 REVIEWED로 바꾸고 신고 대상에는 별도 조치를 하지 않는다.
    @PostMapping("/{reportId}/review")
    public ApiResponse<Void> markReviewed(@PathVariable Long reportId) {
        reportService.markReviewed(reportId);
        return ApiResponse.ok();
    }
}
