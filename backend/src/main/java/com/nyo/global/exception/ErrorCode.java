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
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    ACCESS_FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),

    // course (박소현)
    COURSE_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 강의입니다."),
    COURSE_CAPACITY_EXCEEDED(HttpStatus.CONFLICT, "정원이 마감된 강의입니다."),
    COURSE_ALREADY_DELETED(HttpStatus.CONFLICT, "이미 삭제된 강의입니다."),
    CAPACITY_LESS_THAN_ENROLLED(HttpStatus.BAD_REQUEST, "정원은 현재 등록 인원보다 작을 수 없습니다."),
    COURSE_ALREADY_ENROLLED(HttpStatus.CONFLICT, "이미 수강신청한 강의입니다."),
    COURSE_ENROLLMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "수강신청 내역이 없습니다."),

    // category (박소현)
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 카테고리입니다."),

    // note / community (염상환)
    // 노트 관련 에러코드
    NOTE_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 노트입니다."),
    NOTE_ACCESS_DENIED(HttpStatus.FORBIDDEN, "노트에 대한 권한이 없습니다."),

    // 게시글 관련 에러코드
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 게시글입니다."),
    POST_ACCESS_DENIED(HttpStatus.FORBIDDEN, "게시글에 대한 권한이 없습니다."),

    // 댓글 관련 에러코드
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 댓글입니다."),
    COMMENT_ACCESS_DENIED(HttpStatus.FORBIDDEN, "댓글에 대한 권한이 없습니다."),

    // 좋아요 관련 에러코드
    ALREADY_LIKED(HttpStatus.CONFLICT, "이미 좋아요를 눌렀습니다."),
    LIKE_NOT_FOUND(HttpStatus.NOT_FOUND, "좋아요 내역이 없습니다."),

    // 노트/게시글 이미지 관련 에러코드
    IMAGE_EMPTY(HttpStatus.BAD_REQUEST, "업로드할 이미지가 없습니다."),
    IMAGE_INVALID_EXTENSION(HttpStatus.BAD_REQUEST, "지원하지 않는 이미지 확장자입니다."),
    IMAGE_TOO_LARGE(HttpStatus.BAD_REQUEST, "이미지 용량이 너무 큽니다."),
    IMAGE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "이미지 업로드에 실패했습니다."),
    IMAGE_DELETE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "이미지 삭제에 실패했습니다."),

    // member (오찬빈)
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 회원입니다."),
    MEMBER_DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    MEMBER_DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),
    MEMBER_DUPLICATE_LOGIN_ID(HttpStatus.CONFLICT, "이미 사용 중인 아이디입니다."),
    // 로그인 실패 시 계정 존재 여부가 드러나지 않도록 아이디 없음/비밀번호 틀림을 구분하지 않고 공통으로 사용
    MEMBER_LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 일치하지 않습니다."),
    MEMBER_LOGIN_LOCKED(HttpStatus.TOO_MANY_REQUESTS, "로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요."),
    MEMBER_INACTIVE(HttpStatus.FORBIDDEN, "로그인할 수 없는 계정 상태입니다."),
    MEMBER_ALREADY_WITHDRAWN(HttpStatus.GONE, "이미 탈퇴한 회원입니다."),
    MEMBER_SIGNUP_CONFLICT(HttpStatus.CONFLICT, "이미 처리 중인 요청입니다. 잠시 후 다시 시도해주세요."),
    MEMBER_CANNOT_SANCTION_SELF(HttpStatus.BAD_REQUEST, "관리자는 자기 자신을 제재할 수 없습니다."),
    MEMBER_CANNOT_CHANGE_OWN_ROLE(HttpStatus.BAD_REQUEST, "관리자는 자기 자신의 권한을 변경할 수 없습니다."),
    MEMBER_CURRENT_PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "현재 비밀번호가 일치하지 않습니다."),
    MEMBER_OAUTH_PASSWORD_CHANGE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "소셜 로그인 계정은 비밀번호를 변경할 수 없습니다."),
    MEMBER_INVALID_NEW_PASSWORD(HttpStatus.BAD_REQUEST, "새 비밀번호는 8자 이상 72자 이하로 입력해주세요."),

    // ai / pomodoro (장예지)
    AI_REQUEST_FAILED(HttpStatus.BAD_GATEWAY, "AI 응답 생성에 실패했습니다."),
    POMODORO_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 뽀모도로 기록입니다."),
    POMODORO_ACCESS_DENIED(HttpStatus.FORBIDDEN, "본인의 타이머 기록만 수정할 수 있습니다."),
    POMODORO_INVALID_TIME_RANGE(HttpStatus.BAD_REQUEST, "종료 시각은 시작 시각보다 빠를 수 없습니다."),
    POMODORO_INVALID_DATE_RANGE(HttpStatus.BAD_REQUEST, "종료일은 시작일보다 빠를 수 없습니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
