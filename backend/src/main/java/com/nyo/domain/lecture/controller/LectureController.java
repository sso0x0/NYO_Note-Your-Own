package com.nyo.domain.lecture.controller;

import com.nyo.domain.lecture.dto.LectureResponse;
import com.nyo.domain.lecture.service.LectureService;
import com.nyo.global.config.WebConfig;
import com.nyo.global.response.ApiResponse;
import com.nyo.global.security.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

/**
 * 일반 회원용 강의 조회/이용 API. 시작 페이지 외 모든 기능은 로그인 후에만 접근 가능하도록
 * 목록·상세 조회를 포함해 전부 JWT 인증이 필요하다(SecurityConfig의 anyRequest().authenticated()).
 * 관리자 전용 등록/수정/삭제는 AdminLectureController 참고.
 */
@Slf4j
@RestController
@RequestMapping("/api/lectures")
@RequiredArgsConstructor
@Tag(name = "Lecture", description = "강의 API")
public class LectureController {

    private final LectureService lectureService;

    // 전체 강의 리스트 조회 (페이징)
    @Operation(summary = "전체 강의 목록 조회", description = "삭제되지 않은 전체 강의를 페이징하여 조회합니다.")
    @GetMapping
    public ApiResponse<Page<LectureResponse>> getLectureList(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        warnIfPageSizeExceeded(pageable);
        return ApiResponse.ok(lectureService.getLectureList(pageable));
    }

    // 카테고리별 강의 목록 조회 (페이징)
    // /api/lectures?categoryId=1
    @Operation(summary = "카테고리별 강의 목록 조회", description = "지정한 카테고리에 속한 삭제되지 않은 강의를 페이징하여 조회합니다.")
    @GetMapping(params = "categoryId")
    public ApiResponse<Page<LectureResponse>> getLectureListByCategory(
            @Parameter(description = "조회할 카테고리 ID")
            @RequestParam Long categoryId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        warnIfPageSizeExceeded(pageable);
        return ApiResponse.ok(lectureService.getLectureListByCategory(categoryId, pageable));
    }

    // 강의 검색 (제목/강사명/설명 대상, Elasticsearch 기반)
    @Operation(summary = "강의 검색", description = "키워드로 강의 제목/강사명/설명을 검색합니다.")
    @GetMapping("/search")
    public ApiResponse<Page<LectureResponse>> searchLectures(
            @Parameter(description = "검색 키워드") @RequestParam String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        warnIfPageSizeExceeded(pageable);
        return ApiResponse.ok(lectureService.searchLectures(keyword, pageable));
    }

    // 하나의 강의만 조회 (id 기준, 삭제된 강의는 404)
    @Operation(summary = "강의 단건 조회", description = "id로 강의를 조회합니다. 삭제된 강의는 조회되지 않습니다(404).")
    @GetMapping("/{id}")
    public ApiResponse<LectureResponse> getLecture(
            @Parameter(description = "조회할 강의 ID") @PathVariable Long id) {
        return ApiResponse.ok(lectureService.getLecture(id));
    }

    // 조회수 증가 (상세 페이지 진입 시 호출)
    @Operation(summary = "강의 조회수 증가", description = "상세 페이지 진입 시 호출합니다. 동일 유저 하루 1회만 조회수가 증가합니다.")
    @PostMapping("/{id}/view")
    public ApiResponse<Void> increaseViewCount(
            @Parameter(description = "조회할 강의 ID") @PathVariable Long id) {
        lectureService.increaseViewCount(id, SecurityUtil.getCurrentUserId());
        return ApiResponse.ok();
    }

    // 좋아요
    @Operation(summary = "강의 좋아요", description = "강의에 좋아요를 등록합니다. 이미 좋아요를 눌렀다면 에러를 반환합니다.")
    @PostMapping("/{id}/like")
    public ApiResponse<Void> likeLecture(
            @Parameter(description = "좋아요할 강의 ID") @PathVariable Long id) {
        lectureService.likeLecture(id, SecurityUtil.getCurrentUserId());
        return ApiResponse.ok();
    }

    // 좋아요 취소
    @Operation(summary = "강의 좋아요 취소", description = "강의 좋아요를 취소합니다. 좋아요를 누르지 않은 상태라면 에러를 반환합니다.")
    @DeleteMapping("/{id}/like")
    public ApiResponse<Void> unlikeLecture(
            @Parameter(description = "좋아요 취소할 강의 ID") @PathVariable Long id) {
        lectureService.unlikeLecture(id, SecurityUtil.getCurrentUserId());
        return ApiResponse.ok();
    }

    // 수강신청 여부 조회 (상세/시청 화면 진입 시 접근 가능 여부를 먼저 확인)
    @Operation(summary = "강의 수강신청 여부 조회", description = "현재 로그인한 사용자가 해당 강의에 수강신청했는지 여부를 반환합니다.")
    @GetMapping("/{id}/enroll")
    public ApiResponse<Boolean> isEnrolled(
            @Parameter(description = "조회할 강의 ID") @PathVariable Long id) {
        return ApiResponse.ok(lectureService.isEnrolled(id, SecurityUtil.getCurrentUserId()));
    }

    // 수강신청
    @Operation(summary = "강의 수강신청", description = "강의에 수강신청합니다. 이미 신청했거나 정원이 마감된 경우 에러를 반환합니다.")
    @PostMapping("/{id}/enroll")
    public ApiResponse<Void> enrollLecture(
            @Parameter(description = "수강신청할 강의 ID") @PathVariable Long id) {
        lectureService.enrollLecture(id, SecurityUtil.getCurrentUserId());
        return ApiResponse.ok();
    }

    // 수강신청 취소
    @Operation(summary = "강의 수강신청 취소", description = "강의 수강신청을 취소합니다. 신청 내역이 없다면 에러를 반환합니다.")
    @DeleteMapping("/{id}/enroll")
    public ApiResponse<Void> cancelEnrollment(
            @Parameter(description = "수강신청 취소할 강의 ID") @PathVariable Long id) {
        lectureService.cancelEnrollment(id, SecurityUtil.getCurrentUserId());
        return ApiResponse.ok();
    }

    // size 초과 요청 시 콘솔에 경고 로그만 남김 (실제 처리는 WebConfig에서 이미 50으로 잘림)
    private void warnIfPageSizeExceeded(Pageable pageable) {
        if (pageable.getPageSize() >= WebConfig.MAX_PAGE_SIZE) {
            log.warn("[Lecture] 요청 size가 너무 큽니다. 최대 {}건으로 제한되어 처리됩니다. (요청 size={})",
                    WebConfig.MAX_PAGE_SIZE, pageable.getPageSize());
        }
    }
}
