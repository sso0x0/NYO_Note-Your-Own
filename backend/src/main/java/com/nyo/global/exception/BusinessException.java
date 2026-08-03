package com.nyo.global.exception;

import lombok.Getter;

/**
 * 각 도메인 서비스 로직에서는 이 예외만 던지면 됩니다.
 * 예) throw new BusinessException(ErrorCode.COURSE_NOT_FOUND);
 *
 * 필요하면 도메인별로 상속해서 써도 되지만, 웬만하면 ErrorCode만 추가하는 걸 추천.
 */
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    // ErrorCode에 담긴 메시지를 예외 메시지로 사용하고, 상태 코드 조회를 위해 errorCode 자체도 보관한다
    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
