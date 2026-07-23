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

/**
 * 구글 로그인이 성공적으로 끝난 뒤 Spring Security가 호출하는 핸들러.
 * 세션이 아니라 우리 서버가 직접 발급하는 JWT를 프론트에 전달해서, 아이디/비밀번호 로그인과
 * 인증 방식을 통일한다. 실패했을 때의 처리는 OAuth2FailureHandler를 참고.
 */
@Component
@RequiredArgsConstructor
public class    OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.oauth2.redirect-uri}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        CustomOAuth2User principal = (CustomOAuth2User) authentication.getPrincipal();
        User user = principal.getUser();

        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getRole());

        // 토큰을 쿼리 파라미터가 아니라 URL fragment(#)에 실어 보낸다. 쿼리 파라미터는 브라우저가
        // 그대로 서버에 재전송하기 때문에 Referer 헤더나 access log에 남을 수 있지만, fragment는 서버로 전송되지 않는다.
        // 프론트는 이 redirect-uri 페이지에서 window.location.hash를 파싱해 토큰을 꺼내 저장하면 된다.
        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .fragment("token=" + accessToken)
                .build().toUriString();

        response.sendRedirect(targetUrl);
    }
}
