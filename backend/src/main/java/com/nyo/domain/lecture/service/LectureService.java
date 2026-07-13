package com.nyo.domain.lecture.service;





    // 하나의 강의 조회 (id 기준)
    LectureResponse getLecture(Long id);

    // 강의 수정 (관리자만 가능)
    LectureResponse updateLecture(Long id, LectureRequest request, Long adminId);

    // 강의 삭제 (관리자만 가능)
    void deleteLecture(Long id, Long adminId);
}