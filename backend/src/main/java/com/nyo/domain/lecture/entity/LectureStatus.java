package com.nyo.domain.lecture.entity;

/** 강의 심사 상태. 관리자가 직접 등록하면 즉시 APPROVED, 강사가 등록 신청하면 PENDING으로 시작해 관리자 승인을 거친다. */
public enum LectureStatus {
    PENDING,
    APPROVED,
    REJECTED
}
