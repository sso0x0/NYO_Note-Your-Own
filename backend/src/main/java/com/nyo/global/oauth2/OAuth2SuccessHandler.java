package com.nyo.global.oauth2;

import com.nyo.domain.user.entity.User;
import com.nyo.global.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.oauth2.redirect-uri}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        CustomOAuth2User principal = (CustomOAuth2User) authentication.getPrincipal();
        User user = principal.getUser();

        // 💡 일반 로그인이랑 동일하게 우리 서버가 발급하는 JWT 사용 (세션 방식 X)
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getRole());

        // 💡 프론트가 쿼리파라미터에서 token을 꺼내 저장하는 방식 (redirect-uri는 프론트 라우트)
        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", accessToken)
                .build().toUriString();

        response.sendRedirect(targetUrl);
    }
}