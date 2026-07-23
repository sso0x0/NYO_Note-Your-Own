package com.nyo.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
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
 * oauth2Login()이 켜져 있으면 Spring Security 기본 동작은 인증 안 된 요청을 구글 로그인 페이지로
 * 302 리다이렉트한다. 브라우저 페이지 이동이면 문제없지만, 프론트가 fetch로 호출하는 API 요청은
 * 그 리다이렉트를 따라가다 구글 인증 엔드포인트에서 CORS로 막힌다.
 * API 요청은 리다이렉트 대신 401 JSON을 응답하도록 오버라이드한다.
 */
@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.fail("로그인이 필요합니다.")));
    }
}
