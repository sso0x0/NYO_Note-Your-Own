package com.nyo.domain.pomodoro.controller;

import com.nyo.domain.pomodoro.dto.PomodoroRecordRequest;
import com.nyo.domain.pomodoro.dto.PomodoroRecordResponse;
import com.nyo.domain.pomodoro.dto.PomodoroStudyTimeResponse;
import com.nyo.domain.pomodoro.service.PomodoroService;
import com.nyo.global.response.ApiResponse;
import com.nyo.global.response.PageResponse;
import com.nyo.global.security.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * 뽀모도로 학습 타이머 기록 CRUD 및 통계 조회.
 * "/period", "/stats/today", "/stats/total"은 "/{id}"와 세그먼트 수가 다르거나
 * 더 구체적인 리터럴 경로라 Spring이 알아서 우선 매칭하므로 등록 순서와 무관하게 충돌하지 않습니다.
 */
@Tag(name = "Pomodoro", description = "뽀모도로 학습 타이머 API")
@RestController
@RequestMapping("/api/pomodoros")
@RequiredArgsConstructor
public class PomodoroController {

    private final PomodoroService pomodoroService;

    @Operation(summary = "타이머 기록 등록 (타이머 시작 시 호출)")
    @PostMapping
    public ApiResponse<PomodoroRecordResponse> create(
            @Valid @RequestBody PomodoroRecordRequest request) {
        return ApiResponse.ok(pomodoroService.create(SecurityUtil.getCurrentUserId(), request));
    }

    @Operation(summary = "타이머 기록 수정 (타이머 종료 시 endedAt 포함해 호출)")
    @PatchMapping("/{id}")
    public ApiResponse<PomodoroRecordResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody PomodoroRecordRequest request) {
        return ApiResponse.ok(pomodoroService.update(SecurityUtil.getCurrentUserId(), id, request));
    }

    @Operation(summary = "타이머 기록 단건 조회", description = "본인 기록이 아니면 403을 반환합니다.")
    @GetMapping("/{id}")
    public ApiResponse<PomodoroRecordResponse> getRecord(@PathVariable Long id) {
        return ApiResponse.ok(pomodoroService.getRecord(SecurityUtil.getCurrentUserId(), id));
    }

    @Operation(summary = "회원별 타이머 기록 목록 조회 (최신순)")
    @GetMapping
    public ApiResponse<PageResponse<PomodoroRecordResponse>> getRecords(
            @PageableDefault(sort = "startedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(pomodoroService.getRecords(SecurityUtil.getCurrentUserId(), pageable));
    }

    @Operation(summary = "기간별 타이머 기록 조회 (startDate ~ endDate, 최신순)",
            description = "recordDate(타이머 시작일 기준) 범위로 필터링합니다. endDate가 startDate보다 빠르면 400을 반환합니다.")
    @GetMapping("/period")
    public ApiResponse<PageResponse<PomodoroRecordResponse>> getRecordsByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(sort = "startedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(pomodoroService.getRecordsByPeriod(
                SecurityUtil.getCurrentUserId(), startDate, endDate, pageable));
    }

    @Operation(summary = "오늘 누적 공부 시간(분) 조회",
            description = "endedAt이 채워진(완료된) 세션의 focusMinutes만 합산합니다. 진행 중인 타이머는 제외됩니다.")
    @GetMapping("/stats/today")
    public ApiResponse<PomodoroStudyTimeResponse> getTodayStudyTime() {
        return ApiResponse.ok(pomodoroService.getTodayStudyTime(SecurityUtil.getCurrentUserId()));
    }

    @Operation(summary = "전체 누적 공부 시간(분) 조회",
            description = "endedAt이 채워진(완료된) 세션의 focusMinutes만 합산합니다. 진행 중인 타이머는 제외됩니다.")
    @GetMapping("/stats/total")
    public ApiResponse<PomodoroStudyTimeResponse> getTotalStudyTime() {
        return ApiResponse.ok(pomodoroService.getTotalStudyTime(SecurityUtil.getCurrentUserId()));
    }
}
