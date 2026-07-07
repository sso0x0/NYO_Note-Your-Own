package com.nyo.global.response;

/**
 * 모든 컨트롤러가 이 형태로 응답한다고 약속.
 * 프론트에서는 항상 { success, data, message } 형태로 파싱하면 됩니다.
 *
 * 성공: return ApiResponse.ok(courseResponseDto);
 * 실패: 예외를 던지면 GlobalExceptionHandler가 알아서 이 포맷으로 감싸줍니다.
 */
public record ApiResponse<T>(boolean success, T data, String message) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static ApiResponse<Void> ok() {
        return new ApiResponse<>(true, null, null);
    }

    public static ApiResponse<?> fail(String message) {
        return new ApiResponse<>(false, null, message);
    }
}
