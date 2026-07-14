package com.nyo.domain.lecture.controller;

import com.nyo.domain.lecture.dto.LectureRequest;
import com.nyo.domain.lecture.dto.LectureResponse;
import com.nyo.domain.lecture.service.LectureService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lectures")
@RequiredArgsConstructor
@Tag(name = "Lecture", description = "강의 API")
public class LectureController {

    private final LectureService lectureService;

    // 강의 등록 (테스트용 - 인증 붙기 전까지 adminId를 쿼리파라미터로 받음)
    // /api/lectures?adminId=1
    @PostMapping
    public ResponseEntity<LectureResponse> createLecture(
            @Valid @RequestBody LectureRequest request,
            @RequestParam Long adminId) {
        LectureResponse response = lectureService.createLecture(request, request.getCategoryId(), adminId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 전체 강의 리스트 조회 (페이징, 200 ok)
    @GetMapping
    public ResponseEntity<Page<LectureResponse>> getLectureList(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(lectureService.getLectureList(pageable));
    }

    // 카테고리별 강의 목록 조회 (페이징)
    // /api/lectures?categoryId=1
    @GetMapping(params = "categoryId")
    public ResponseEntity<Page<LectureResponse>> getLectureListByCategory(
            @RequestParam Long categoryId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(lectureService.getLectureListByCategory(categoryId, pageable));
    }

    // 하나의 강의만 조회 (id 기준, 삭제된 강의는 404)
    @GetMapping("/{id}")
    public ResponseEntity<LectureResponse> getLecture(@PathVariable Long id) {
        return ResponseEntity.ok(lectureService.getLecture(id));
    }

    // 관리자 전용 단건 조회 (삭제된 강의도 조회 가능)
    @GetMapping("/{id}/admin")
    public ResponseEntity<LectureResponse> getLectureForAdmin(
            @PathVariable Long id,
            @RequestParam Long adminId) {
        return ResponseEntity.ok(lectureService.getLectureForAdmin(id, adminId));
    }

    // 강의 수정 (테스트용 - 인증 붙기 전까지 adminId를 쿼리파라미터로 받음)
    @PutMapping("/{id}")
    public ResponseEntity<LectureResponse> updateLecture(
            @PathVariable Long id,
            @Valid @RequestBody LectureRequest request,
            @RequestParam Long adminId) {
        LectureResponse response = lectureService.updateLecture(id, request, adminId);
        return ResponseEntity.ok(response);
    }

    // 강의 삭제 (테스트용 - 인증 붙기 전까지 adminId를 쿼리파라미터로 받음)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLecture(
            @PathVariable Long id,
            @RequestParam Long adminId) {
        lectureService.deleteLecture(id, adminId);
        return ResponseEntity.noContent().build();
    }

    // 조회수 증가 (상세 페이지 진입 시 호출, 테스트용 - userId를 쿼리파라미터로 받음)
    // /api/lectures/{id}/view?userId=1
    @PostMapping("/{id}/view")
    public ResponseEntity<Void> increaseViewCount(
            @PathVariable Long id,
            @RequestParam Long userId) {
        lectureService.increaseViewCount(id, userId);
        return ResponseEntity.ok().build();
    }

    // 좋아요
    @PostMapping("/{id}/like")
    public ResponseEntity<Void> likeLecture(@PathVariable Long id, @RequestParam Long userId) {
        lectureService.likeLecture(id, userId);
        return ResponseEntity.ok().build();
    }

    // 좋아요 취소
    @DeleteMapping("/{id}/like")
    public ResponseEntity<Void> unlikeLecture(@PathVariable Long id, @RequestParam Long userId) {
        lectureService.unlikeLecture(id, userId);
        return ResponseEntity.ok().build();
    }
}