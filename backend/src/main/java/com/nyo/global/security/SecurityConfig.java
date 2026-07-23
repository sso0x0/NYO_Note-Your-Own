package com.nyo.global.security;

import com.nyo.global.jwt.JwtAuthenticationFilter;
import com.nyo.global.oauth2.CustomOAuth2UserService;
import com.nyo.global.oauth2.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import com.nyo.global.oauth2.OAuth2FailureHandler;
import java.util.List;

/**
 * 💡 FIXED: 3단계(CORS 테스트용 전체 permitAll) 임시 설정을 실제 인증 로직으로 교체.
 * - BCrypt 비밀번호 암호화
 * - JWT 기반 Stateless 인증
 * - 구글 OAuth2 소셜 로그인
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final OAuth2FailureHandler oAuth2FailureHandler;      // 추가

    // 💡 application.yml의 CORS 허용 도메인 리스트를 주입받음
    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    // 인증 없이 열어두는 경로: 회원가입/로그인/중복확인, OAuth2 리다이렉트, API 문서, 헬스체크.
    // 랜딩 페이지는 실제 데이터를 API로 가져오지 않으므로(더미 데이터) 카테고리·강의·노트·게시글 조회는
    // 여기 포함하지 않는다 — 로그인 전에는 시작 페이지 외에는 아무 것도 조회할 수 없어야 한다.
    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/users/signup", "/api/users/login",
            "/api/users/check-login-id", "/api/users/check-email", "/api/users/check-nickname",
            "/oauth2/**", "/login/oauth2/**",
            "/docs/**", "/swagger-ui/**", "/v3/api-docs/**",
            "/api/health/**"
    };

    // 💡 누락되었던 CORS 설정 내용 복구 및 @Bean 등록
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // JWT는 헤더로 토큰을 보내고 서버가 세션/쿠키를 안 쓰니 CSRF 공격 경로 자체가 없어 비활성화
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // JWT는 세션 안 씀
                .authorizeHttpRequests(this::configureAuthorization)
                // oauth2Login 기본 동작은 인증 안 된 요청을 구글 로그인 페이지로 302 리다이렉트하는데,
                // fetch로 호출하는 API가 이걸 따라가면 구글 인증 엔드포인트에서 CORS로 막힌다.
                // API는 리다이렉트 대신 401 JSON을 받도록 entry point를 오버라이드한다.
                .exceptionHandling(ex -> ex.authenticationEntryPoint(restAuthenticationEntryPoint))
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)                  // 추가
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // requestMatchers는 등록 순서대로 먼저 매칭되는 규칙이 적용된다.
    // "완전 공개(로그인 전 접근 가능한 시작 페이지용 API) → 관리자 → 그 외 전부 로그인 필요" 순서.
    // 강의/노트/게시글/댓글/이미지 등은 전부 로그인 후에만 접근 가능해야 하므로 개별 permitAll을 두지 않고
    // anyRequest().authenticated()에 맡긴다.
    private void configureAuthorization(
            AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry auth) {
        auth
                .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN") // TODO: 관리자 파트 구현 시 활성화
                .anyRequest().authenticated();
    }
}
