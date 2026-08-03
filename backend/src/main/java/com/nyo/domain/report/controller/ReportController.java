package com.nyo.domain.report.controller;

import com.nyo.domain.report.dto.ReportRequest;
import com.nyo.domain.report.service.ReportService;
import com.nyo.global.response.ApiResponse;
import com.nyo.global.security.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

// 사용자가 노트/게시글/댓글을 신고할 때 사용하는 API를 제공하는 컨트롤러
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // 노트/게시글/댓글 신고를 접수한다
    @PostMapping
    public ApiResponse<Void> create(@Valid @RequestBody ReportRequest request) {
        // 신고자 조작을 막기 위해 reporterId는 요청 본문이 아닌 JWT 로그인 정보에서 가져온다.
        reportService.create(SecurityUtil.getCurrentUserId(), request);
        return ApiResponse.ok();
    }
}
