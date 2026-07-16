package com.nyo.global.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * 구글 로그인이 실패했을 때 Spring Security가 호출하는 핸들러.
 * 가장 흔한 케이스는 CustomOAuth2UserService가 정지/탈퇴 회원을 걸러내며 던지는 예외다.
 * OAuth2SuccessHandler와 동일하게 프론트 redirect-uri로 돌려보내되, token 대신 실패 사유를 담은
 * error 쿼리 파라미터를 붙인다 (실패 사유는 굳이 숨길 필요가 없어 fragment 대신 쿼리 파라미터를 사용한다).
 */
@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    @Value("${app.oauth2.redirect-uri}")
    private String redirectUri;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        // 한글 에러 메시지가 그대로 들어가므로 UTF-8로 퍼센트 인코딩해서 URL을 안전하게 구성한다.
        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("error", exception.getMessage())
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUriString();

        response.sendRedirect(targetUrl);
    }
}
