package com.nyo.domain.lecture.controller;

import com.nyo.domain.lecture.dto.LectureRequest;
import com.nyo.domain.lecture.dto.LectureResponse;
import com.nyo.domain.lecture.service.LectureService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/lectures")
@RequiredArgsConstructor
@Tag(name = "Lecture", description = "강의 API")
public class LectureController {

    private final LectureService lectureService;

    }

    // 하나의 강의만 조회 (id 기준)
    @GetMapping("/{id}")
    public ResponseEntity<LectureResponse> getLecture(@PathVariable Long id) {
        return ResponseEntity.ok(lectureService.getLecture(id));
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
}