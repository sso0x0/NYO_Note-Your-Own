package com.nyo.domain.report.entity;

/**
 * 신고가 가리키는 서비스 대상을 구분한다.
 * 대상별 테이블을 따로 만들지 않고 targetType + targetId 조합으로 연결한다.
 */
public enum ReportTargetType {
    NOTE,
    POST,
    COMMENT
}
