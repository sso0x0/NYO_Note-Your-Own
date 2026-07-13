package com.nyo.domain.admin.controller;

import com.nyo.domain.admin.service.AdminStatsService;
import com.nyo.domain.common.dto.response.AdminSummaryResponse;
import com.nyo.domain.common.dto.response.DailyCountResponse;
import com.nyo.domain.common.dto.response.LecturePopularityResponse;
import com.nyo.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * TODO: JWT 인증(4단계) 구현 후 ADMIN 권한 체크 추가 (@PreAuthorize("hasRole('ADMIN')"))
 */
@Tag(name = "Admin Stats", description = "관리자 대시보드 통계 API")
@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    @Operation(summary = "전체 요약 (회원/강의/노트/게시글 수)")
    @GetMapping("/summary")
    public ApiResponse<AdminSummaryResponse> getSummary() {
        return ApiResponse.ok(adminStatsService.getSummary());
    }

    @Operation(summary = "강의별 인기도 (좋아요·조회수 상위 강의)")
    @GetMapping("/lectures/popularity")
    public ApiResponse<List<LecturePopularityResponse>> getLecturePopularity(
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.ok(adminStatsService.getLecturePopularity(limit));
    }

    @Operation(summary = "노트 작성 현황 (일자별 작성 수)")
    @GetMapping("/notes/daily")
    public ApiResponse<List<DailyCountResponse>> getDailyNoteCounts(
            @RequestParam(defaultValue = "30") int days) {
        return ApiResponse.ok(adminStatsService.getDailyNoteCounts(days));
    }

    @Operation(summary = "회원 가입 추이 (일자별 가입 수)")
    @GetMapping("/users/daily")
    public ApiResponse<List<DailyCountResponse>> getDailySignupCounts(
            @RequestParam(defaultValue = "30") int days) {
        return ApiResponse.ok(adminStatsService.getDailySignupCounts(days));
    }
}
