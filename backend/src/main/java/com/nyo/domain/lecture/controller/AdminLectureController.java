package com.nyo.domain.lecture.controller;

import com.nyo.domain.lecture.dto.LectureRequest;
import com.nyo.domain.lecture.dto.LectureResponse;
import com.nyo.domain.lecture.service.LectureService;
import com.nyo.global.response.ApiResponse;
import com.nyo.global.security.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    // 강의 등록
    @Operation(summary = "강의 등록", description = "관리자가 새로운 강의(녹화본)를 등록합니다.")
    @PostMapping
    public ApiResponse<LectureResponse> createLecture(@Valid @RequestBody LectureRequest request) {
        Long adminId = SecurityUtil.getCurrentUserId();
        return ApiResponse.ok(lectureService.createLecture(request, adminId));
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

    // 검색 색인 재구축
    @Operation(summary = "강의 검색 색인 재구축", description = "DB의 전체 강의로 Elasticsearch 색인을 다시 만듭니다. 색인 유실 복구, 기존 데이터 최초 반영 등에 사용합니다.")
    @PostMapping("/reindex")
    public ApiResponse<Void> reindexLectures() {
        lectureService.reindexAllLectures();
        return ApiResponse.ok();
    }
}
