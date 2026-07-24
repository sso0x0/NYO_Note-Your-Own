package com.nyo.domain.lecture.service;

import com.nyo.domain.lecture.dto.LectureRequest;
import com.nyo.domain.lecture.dto.LectureResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LectureService {

    // 새로운 강의 등록 (관리자만 가능)
    LectureResponse createLecture(LectureRequest request, Long adminId);

    // 전체 강의 목록 조회 (페이징)
    Page<LectureResponse> getLectureList(Pageable pageable);

    // 카테고리별 강의 목록 조회 (페이징)
    Page<LectureResponse> getLectureListByCategory(Long categoryId, Pageable pageable);

    // 하나의 강의 조회 (id 기준)
    LectureResponse getLecture(Long id);

    // 관리자 전용 단건 조회 (삭제된 강의도 조회 가능)
    LectureResponse getLectureForAdmin(Long id, Long adminId);

    // 강의 수정 (관리자만 가능)
    LectureResponse updateLecture(Long id, LectureRequest request, Long adminId);

    // 강의 삭제 (관리자만 가능)
    void deleteLecture(Long id, Long adminId);

    // 조회수 증가 (하루 1회 제한)
    void increaseViewCount(Long id, Long userId);

    // 좋아요
    void likeLecture(Long id, Long userId);

    // 좋아요 취소
    void unlikeLecture(Long id, Long userId);

    // 현재 로그인 사용자의 좋아요 여부 조회 (상세 화면 하트 아이콘 상태 결정용)
    boolean isLiked(Long id, Long userId);

    // 수강신청
    void enrollLecture(Long id, Long userId);

    // 수강신청 취소
    void cancelEnrollment(Long id, Long userId);

    // 현재 로그인 사용자의 수강신청 여부 조회 (상세/시청 화면에서 접근 가능 여부 판단용)
    boolean isEnrolled(Long id, Long userId);

    // 인기 강의(isPopular) 갱신 (좋아요수/조회수 상위 N개, 배치/스케줄러에서 호출)
    void refreshPopularLectures();

    // 키워드로 강의 검색 (제목/강사명/설명 대상, Elasticsearch 기반)
    Page<LectureResponse> searchLectures(String keyword, Pageable pageable);

    // 전체 강의로 Elasticsearch 색인 재구축 (색인 유실 복구, 초기 데이터 반영 등에 사용, 관리자 전용)
    void reindexAllLectures();
}