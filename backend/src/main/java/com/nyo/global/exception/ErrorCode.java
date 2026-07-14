package com.nyo.global.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 도메인별로 필요한 에러코드를 여기에 이어서 추가하면 됩니다.
 * 네이밍 규칙: {도메인}_{내용}  예) COURSE_NOT_FOUND, MEMBER_DUPLICATE_EMAIL
 */
@Getter
public enum ErrorCode {

    // common
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "잘못된 입력입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),

    // 좋아요 관련 에러
    ALREADY_LIKED(HttpStatus.CONFLICT, "이미 좋아요를 눌렀습니다."),
    LIKE_NOT_FOUND(HttpStatus.NOT_FOUND, "좋아요 내역이 없습니다."),

    // course (박소현)
    COURSE_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 강의입니다."),
    COURSE_CAPACITY_EXCEEDED(HttpStatus.CONFLICT, "정원이 마감된 강의입니다."),
    COURSE_ALREADY_DELETED(HttpStatus.CONFLICT, "이미 삭제된 강의입니다."),
    CAPACITY_LESS_THAN_ENROLLED(HttpStatus.BAD_REQUEST, "정원은 현재 등록 인원보다 작을 수 없습니다."),

    // category (박소현)
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 카테고리입니다."),

    // note / community (염상환)
    NOTE_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 노트입니다."),
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 게시글입니다."),

    // member (오찬빈)
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 회원입니다."),
    MEMBER_DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    MEMBER_DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),

    // ai / pomodoro (장예지)
    AI_REQUEST_FAILED(HttpStatus.BAD_GATEWAY, "AI 응답 생성에 실패했습니다."),
    POMODORO_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 뽀모도로 기록입니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
