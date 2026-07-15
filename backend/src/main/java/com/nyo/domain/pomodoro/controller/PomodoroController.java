package com.nyo.domain.pomodoro.controller;

import com.nyo.domain.pomodoro.dto.PomodoroRecordRequest;
import com.nyo.domain.pomodoro.dto.PomodoroRecordResponse;
import com.nyo.domain.pomodoro.service.PomodoroService;
import com.nyo.global.response.ApiResponse;
import com.nyo.global.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * TODO: JWT 인증(4단계) 구현 후 userId 쿼리 파라미터를 인증 정보 추출로 교체
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
            @RequestParam Long userId,
            @Valid @RequestBody PomodoroRecordRequest request) {
        return ApiResponse.ok(pomodoroService.create(userId, request));
    }

    @Operation(summary = "타이머 기록 수정 (타이머 종료 시 endedAt 포함해 호출)")
    @PatchMapping("/{id}")
    public ApiResponse<PomodoroRecordResponse> update(
            @RequestParam Long userId,
            @PathVariable Long id,
            @Valid @RequestBody PomodoroRecordRequest request) {
        return ApiResponse.ok(pomodoroService.update(userId, id, request));
    }

    @Operation(summary = "회원별 타이머 기록 목록 조회 (최신순)")
    @GetMapping
    public ApiResponse<PageResponse<PomodoroRecordResponse>> getRecords(
            @RequestParam Long userId,
            @PageableDefault(sort = "startedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(pomodoroService.getRecords(userId, pageable));
    }
}
