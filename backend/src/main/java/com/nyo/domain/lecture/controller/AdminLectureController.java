package com.nyo.domain.lecture.controller;

import com.nyo.domain.lecture.dto.LectureAdminResponse;
import com.nyo.domain.lecture.dto.LectureRejectRequest;
import com.nyo.domain.lecture.dto.LectureRequest;
import com.nyo.domain.lecture.dto.LectureResponse;
import com.nyo.domain.lecture.entity.LectureStatus;
import com.nyo.domain.lecture.service.LectureService;
import com.nyo.global.response.ApiResponse;
import com.nyo.global.security.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

/**
 * 관리자 전용 강의 관리 API. SecurityConfig에서 "/api/admin/**" → hasRole("ADMIN")으로 보호되므로
 * 여기 메서드들은 인증/권한 체크를 따로 하지 않는다 (필터 단에서 이미 걸러짐).
 */
@Tag(name = "Admin - Lecture", description = "관리자 강의 관리 API")
@RestController
@RequestMapping("/api/admin/lectures")
@RequiredArgsConstructor
public class AdminLectureController {

    private final LectureService lectureService;

    // 관리자 강의 관리 목록 (강의별 노트/댓글 개수 포함). categoryId/status를 주면 해당 조건으로 필터링한다.
    @Operation(summary = "강의 목록 조회 (노트/댓글 개수 포함, 카테고리·심사 상태 필터)")
    @GetMapping
    public ApiResponse<Page<LectureAdminResponse>> getLectureList(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) LectureStatus status,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ApiResponse.ok(lectureService.adminGetLectureList(categoryId, status, pageable));
    }

    // 강의 등록
    @Operation(summary = "강의 등록", description = "관리자가 새로운 강의(녹화본)를 등록합니다.")
    @PostMapping
    public ApiResponse<LectureResponse> createLecture(@Valid @RequestBody LectureRequest request) {
        Long adminId = SecurityUtil.getCurrentUserId();
        return ApiResponse.ok(lectureService.createLecture(request, adminId));
    }

    // 강사가 등록 신청한 강의 승인
    @Operation(summary = "강의 등록 신청 승인", description = "강사가 등록 신청한 강의를 승인해 일반 목록/검색에 노출합니다.")
    @PostMapping("/{id}/approve")
    public ApiResponse<Void> approveLecture(@PathVariable Long id) {
        lectureService.approveLecture(id, SecurityUtil.getCurrentUserId());
        return ApiResponse.ok();
    }

    // 강사가 등록 신청한 강의 반려
    @Operation(summary = "강의 등록 신청 반려", description = "강사가 등록 신청한 강의를 사유와 함께 반려합니다.")
    @PostMapping("/{id}/reject")
    public ApiResponse<Void> rejectLecture(@PathVariable Long id, @Valid @RequestBody LectureRejectRequest request) {
        lectureService.rejectLecture(id, SecurityUtil.getCurrentUserId(), request.reason());
        return ApiResponse.ok();
    }

    // 관리자 전용 단건 조회 (삭제된 강의도 조회 가능)
    @Operation(summary = "강의 단건 조회 (관리자용)", description = "삭제된 강의를 포함하여 id로 강의를 조회합니다.")
    @GetMapping("/{id}")
    public ApiResponse<LectureResponse> getLectureForAdmin(
            @Parameter(description = "조회할 강의 ID") @PathVariable Long id) {
        Long adminId = SecurityUtil.getCurrentUserId();
        return ApiResponse.ok(lectureService.getLectureForAdmin(id, adminId));
    }

    // 강의 수정
    @Operation(summary = "강의 수정", description = "관리자가 기존 강의 정보를 수정합니다.")
    @PutMapping("/{id}")
    public ApiResponse<LectureResponse> updateLecture(
            @Parameter(description = "수정할 강의 ID") @PathVariable Long id,
            @Valid @RequestBody LectureRequest request) {
        Long adminId = SecurityUtil.getCurrentUserId();
        return ApiResponse.ok(lectureService.updateLecture(id, request, adminId));
    }

    // 강의 삭제
    @Operation(summary = "강의 삭제", description = "관리자가 강의를 삭제 처리합니다. 실제 삭제가 아닌 isDeleted 플래그 처리입니다.")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteLecture(
            @Parameter(description = "삭제할 강의 ID") @PathVariable Long id) {
        Long adminId = SecurityUtil.getCurrentUserId();
        lectureService.deleteLecture(id, adminId);
        return ApiResponse.ok();
    }

    // 삭제된 강의 복구
    @Operation(summary = "삭제된 강의 복구", description = "관리자가 삭제 처리한 강의를 복구하여 다시 노출합니다.")
    @PostMapping("/{id}/restore")
    public ApiResponse<Void> restoreLecture(
            @Parameter(description = "복구할 강의 ID") @PathVariable Long id) {
        Long adminId = SecurityUtil.getCurrentUserId();
        lectureService.restoreLecture(id, adminId);
        return ApiResponse.ok();
    }

    // 검색 색인 재구축
    @Operation(summary = "강의 검색 색인 재구축", description = "DB의 전체 강의로 Elasticsearch 색인을 다시 만듭니다. 색인 유실 복구, 기존 데이터 최초 반영 등에 사용합니다.")
    @PostMapping("/reindex")
    public ApiResponse<Void> reindexLectures() {
        lectureService.reindexAllLectures();
        return ApiResponse.ok();
    }
}
