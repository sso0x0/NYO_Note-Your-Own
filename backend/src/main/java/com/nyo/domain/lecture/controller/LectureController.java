package com.nyo.domain.lecture.controller;

import com.nyo.domain.lecture.dto.LectureRequest;
import com.nyo.domain.lecture.dto.LectureResponse;
import com.nyo.domain.lecture.service.LectureService;
import com.nyo.global.config.WebConfig;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/lectures")
@RequiredArgsConstructor
@Tag(name = "Lecture", description = "강의 API")
public class LectureController {

    private final LectureService lectureService;

    // 강의 등록 (테스트용 - 인증 붙기 전까지 adminId를 쿼리파라미터로 받음)
    // /api/lectures?adminId=1
    @Operation(summary = "강의 등록", description = "관리자가 새로운 강의(녹화본)를 등록합니다. (관리자 전용)")
    @PostMapping
    public ResponseEntity<LectureResponse> createLecture(
            @Valid @RequestBody LectureRequest request,
            @Parameter(description = "등록 요청 관리자 ID (임시: 인증 붙기 전까지 쿼리파라미터로 받음)")
            @RequestParam Long adminId) {
        LectureResponse response = lectureService.createLecture(request, request.getCategoryId(), adminId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 전체 강의 리스트 조회 (페이징, 200 ok)
    @Operation(summary = "전체 강의 목록 조회", description = "삭제되지 않은 전체 강의를 페이징하여 조회합니다.")
    @GetMapping
    public ResponseEntity<Page<LectureResponse>> getLectureList(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        warnIfPageSizeExceeded(pageable);
        return ResponseEntity.ok(lectureService.getLectureList(pageable));
    }

    // 카테고리별 강의 목록 조회 (페이징)
    // /api/lectures?categoryId=1
    @Operation(summary = "카테고리별 강의 목록 조회", description = "지정한 카테고리에 속한 삭제되지 않은 강의를 페이징하여 조회합니다.")
    @GetMapping(params = "categoryId")
    public ResponseEntity<Page<LectureResponse>> getLectureListByCategory(
            @Parameter(description = "조회할 카테고리 ID")
            @RequestParam Long categoryId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        warnIfPageSizeExceeded(pageable);
        return ResponseEntity.ok(lectureService.getLectureListByCategory(categoryId, pageable));
    }

    // 하나의 강의만 조회 (id 기준, 삭제된 강의는 404)
    @Operation(summary = "강의 단건 조회", description = "id로 강의를 조회합니다. 삭제된 강의는 조회되지 않습니다(404).")
    @GetMapping("/{id}")
    public ResponseEntity<LectureResponse> getLecture(
            @Parameter(description = "조회할 강의 ID") @PathVariable Long id) {
        return ResponseEntity.ok(lectureService.getLecture(id));
    }

    // 관리자 전용 단건 조회 (삭제된 강의도 조회 가능)
    @Operation(summary = "강의 단건 조회 (관리자용)", description = "삭제된 강의를 포함하여 id로 강의를 조회합니다. (관리자 전용)")
    @GetMapping("/{id}/admin")
    public ResponseEntity<LectureResponse> getLectureForAdmin(
            @Parameter(description = "조회할 강의 ID") @PathVariable Long id,
            @Parameter(description = "요청 관리자 ID (임시: 인증 붙기 전까지 쿼리파라미터로 받음)")
            @RequestParam Long adminId) {
        return ResponseEntity.ok(lectureService.getLectureForAdmin(id, adminId));
    }

    // 강의 수정 (테스트용 - 인증 붙기 전까지 adminId를 쿼리파라미터로 받음)
    @Operation(summary = "강의 수정", description = "관리자가 기존 강의 정보를 수정합니다. (관리자 전용)")
    @PutMapping("/{id}")
    public ResponseEntity<LectureResponse> updateLecture(
            @Parameter(description = "수정할 강의 ID") @PathVariable Long id,
            @Valid @RequestBody LectureRequest request,
            @Parameter(description = "요청 관리자 ID (임시: 인증 붙기 전까지 쿼리파라미터로 받음)")
            @RequestParam Long adminId) {
        LectureResponse response = lectureService.updateLecture(id, request, adminId);
        return ResponseEntity.ok(response);
    }

    // 강의 삭제 (테스트용 - 인증 붙기 전까지 adminId를 쿼리파라미터로 받음)
    @Operation(summary = "강의 삭제", description = "관리자가 강의를 삭제 처리합니다. 실제 삭제가 아닌 isDeleted 플래그 처리입니다. (관리자 전용)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLecture(
            @Parameter(description = "삭제할 강의 ID") @PathVariable Long id,
            @Parameter(description = "요청 관리자 ID (임시: 인증 붙기 전까지 쿼리파라미터로 받음)")
            @RequestParam Long adminId) {
        lectureService.deleteLecture(id, adminId);
        return ResponseEntity.noContent().build();
    }

    // 조회수 증가 (상세 페이지 진입 시 호출, 테스트용 - userId를 쿼리파라미터로 받음)
    // /api/lectures/{id}/view?userId=1
    @Operation(summary = "강의 조회수 증가", description = "상세 페이지 진입 시 호출합니다. 동일 유저 하루 1회만 조회수가 증가합니다.")
    @PostMapping("/{id}/view")
    public ResponseEntity<Void> increaseViewCount(
            @Parameter(description = "조회할 강의 ID") @PathVariable Long id,
            @Parameter(description = "요청 유저 ID (임시: 인증 붙기 전까지 쿼리파라미터로 받음)")
            @RequestParam Long userId) {
        lectureService.increaseViewCount(id, userId);
        return ResponseEntity.ok().build();
    }

    // 좋아요
    @Operation(summary = "강의 좋아요", description = "강의에 좋아요를 등록합니다. 이미 좋아요를 눌렀다면 에러를 반환합니다.")
    @PostMapping("/{id}/like")
    public ResponseEntity<Void> likeLecture(
            @Parameter(description = "좋아요할 강의 ID") @PathVariable Long id,
            @Parameter(description = "요청 유저 ID (임시: 인증 붙기 전까지 쿼리파라미터로 받음)")
            @RequestParam Long userId) {
        lectureService.likeLecture(id, userId);
        return ResponseEntity.ok().build();
    }

    // 좋아요 취소
    @Operation(summary = "강의 좋아요 취소", description = "강의 좋아요를 취소합니다. 좋아요를 누르지 않은 상태라면 에러를 반환합니다.")
    @DeleteMapping("/{id}/like")
    public ResponseEntity<Void> unlikeLecture(
            @Parameter(description = "좋아요 취소할 강의 ID") @PathVariable Long id,
            @Parameter(description = "요청 유저 ID (임시: 인증 붙기 전까지 쿼리파라미터로 받음)")
            @RequestParam Long userId) {
        lectureService.unlikeLecture(id, userId);
        return ResponseEntity.ok().build();
    }

    // 수강신청 (테스트용 - 인증 붙기 전까지 userId를 쿼리파라미터로 받음)
    @Operation(summary = "강의 수강신청", description = "강의에 수강신청합니다. 이미 신청했거나 정원이 마감된 경우 에러를 반환합니다.")
    @PostMapping("/{id}/enroll")
    public ResponseEntity<Void> enrollLecture(
            @Parameter(description = "수강신청할 강의 ID") @PathVariable Long id,
            @Parameter(description = "요청 유저 ID (임시: 인증 붙기 전까지 쿼리파라미터로 받음)")
            @RequestParam Long userId) {
        lectureService.enrollLecture(id, userId);
        return ResponseEntity.ok().build();
    }

    // 수강신청 취소
    @Operation(summary = "강의 수강신청 취소", description = "강의 수강신청을 취소합니다. 신청 내역이 없다면 에러를 반환합니다.")
    @DeleteMapping("/{id}/enroll")
    public ResponseEntity<Void> cancelEnrollment(
            @Parameter(description = "수강신청 취소할 강의 ID") @PathVariable Long id,
            @Parameter(description = "요청 유저 ID (임시: 인증 붙기 전까지 쿼리파라미터로 받음)")
            @RequestParam Long userId) {
        lectureService.cancelEnrollment(id, userId);
        return ResponseEntity.ok().build();
    }

    // size 초과 요청 시 콘솔에 경고 로그만 남김 (실제 처리는 WebConfig에서 이미 50으로 잘림)
    private void warnIfPageSizeExceeded(Pageable pageable) {
        if (pageable.getPageSize() >= WebConfig.MAX_PAGE_SIZE) {
            log.warn("[Lecture] 요청 size가 너무 큽니다. 최대 {}건으로 제한되어 처리됩니다. (요청 size={})",
                    WebConfig.MAX_PAGE_SIZE, pageable.getPageSize());
        }
    }
}