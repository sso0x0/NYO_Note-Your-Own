package com.nyo.domain.lecture.service;

import com.nyo.domain.lecture.dto.LectureAdminResponse;
import com.nyo.domain.lecture.dto.LectureRequest;
import com.nyo.domain.lecture.dto.LectureResponse;
import com.nyo.domain.lecture.entity.LectureStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LectureService {

    // 새로운 강의 등록 (관리자만 가능, 즉시 승인 상태로 공개)
    LectureResponse createLecture(LectureRequest request, Long adminId);

    // 강사가 강의 등록을 신청 (INSTRUCTOR 권한만 가능). 관리자 승인 전까지는 PENDING 상태로 본인/관리자에게만 보인다.
    LectureResponse createInstructorLecture(LectureRequest request, Long instructorUserId);

    // 강사 본인이 등록 신청한 강의 목록 조회 (마이페이지 "강의 등록" 탭, 페이징)
    Page<LectureResponse> getMyLectures(Long userId, Pageable pageable);

    // 강사의 강의 등록 신청을 관리자가 승인 (일반 목록/검색에 노출)
    void approveLecture(Long lectureId, Long adminId);

    // 강사의 강의 등록 신청을 관리자가 반려
    void rejectLecture(Long lectureId, Long adminId, String reason);

    // 전체 강의 목록 조회 (페이징, 승인된 강의만)
    Page<LectureResponse> getLectureList(Pageable pageable);

    // 관리자 강의 관리 목록 조회 (노트/댓글 개수 포함, 페이징). categoryId/status가 null이면 필터하지 않는다.
    Page<LectureAdminResponse> adminGetLectureList(Long categoryId, LectureStatus status, Pageable pageable);

    // 카테고리별 강의 목록 조회 (페이징, 승인된 강의만)
    Page<LectureResponse> getLectureListByCategory(Long categoryId, Pageable pageable);

    // 하나의 강의 조회 (id 기준). 승인 전(PENDING/REJECTED) 강의는 등록한 강사 본인 또는 관리자만 조회할 수 있다.
    LectureResponse getLecture(Long id, Long userId);

    // 관리자 전용 단건 조회 (삭제된 강의도 조회 가능)
    LectureResponse getLectureForAdmin(Long id, Long adminId);

    // 강의 수정 (관리자만 가능)
    LectureResponse updateLecture(Long id, LectureRequest request, Long adminId);

    // 강의 삭제 (관리자만 가능)
    void deleteLecture(Long id, Long adminId);

    // 삭제된 강의 복구 (관리자만 가능, DB에서 완전히 삭제되기 전까지 되돌릴 수 있음)
    void restoreLecture(Long id, Long adminId);

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
    Page<LectureResponse> searchLectures(String keyword, String searchType, Pageable pageable);

    // 전체 강의로 Elasticsearch 색인 재구축 (색인 유실 복구, 초기 데이터 반영 등에 사용, 관리자 전용)
    void reindexAllLectures();
}
