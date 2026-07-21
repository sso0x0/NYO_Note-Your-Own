package com.nyo.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nyo.global.exception.ErrorCode;
import com.nyo.global.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 인증은 됐지만 권한이 없는 요청(예: 관리자 전용 API를 일반 회원이 호출) 처리.
 * 기본 동작은 빈 403 응답이라, 다른 컨트롤러와 동일한 ApiResponse 포맷으로 통일한다.
 */
@Component
@RequiredArgsConstructor
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                        AccessDeniedException accessDeniedException) throws IOException {
        response.setStatus(ErrorCode.ACCESS_FORBIDDEN.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                objectMapper.writeValueAsString(ApiResponse.fail(ErrorCode.ACCESS_FORBIDDEN.getMessage())));
    }
}
