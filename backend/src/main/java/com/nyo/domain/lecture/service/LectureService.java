package com.nyo.domain.lecture.service;

import com.nyo.domain.lecture.dto.LectureRequest;
import com.nyo.domain.lecture.dto.LectureResponse;

import java.util.List;

public interface LectureService {

    // 새로운 강의 등록 (관리자만 가능)
    LectureResponse createLecture(LectureRequest request, Long categoryId, Long adminId);

    // 전체 강의 목록 조회
    List<LectureResponse> getLectureList();

    // 하나의 강의 조회 (id 기준)
    LectureResponse getLecture(Long id);

    // 강의 수정 (관리자만 가능)
    LectureResponse updateLecture(Long id, LectureRequest request, Long adminId);

    // 강의 삭제 (관리자만 가능)
    void deleteLecture(Long id, Long adminId);
}