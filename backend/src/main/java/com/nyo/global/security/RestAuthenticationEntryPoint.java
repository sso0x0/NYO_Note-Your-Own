package com.nyo.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nyo.global.exception.ErrorCode;
import com.nyo.global.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * oauth2Login()이 켜져 있으면 Spring Security 기본 진입점은 미인증 요청을
 * 구글 로그인 페이지로 302 리다이렉트한다. JWT 기반 REST API 클라이언트는
 * 리다이렉트를 처리할 수 없으니, 다른 컨트롤러와 동일한 ApiResponse 포맷으로 401을 응답한다.
 */
@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                          AuthenticationException authException) throws IOException {
        response.setStatus(ErrorCode.UNAUTHENTICATED.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                objectMapper.writeValueAsString(ApiResponse.fail(ErrorCode.UNAUTHENTICATED.getMessage())));
    }
}
