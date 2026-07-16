package com.nyo.global.security;

import com.nyo.global.jwt.JwtAuthenticationFilter;
import com.nyo.global.oauth2.CustomOAuth2UserService;
import com.nyo.global.oauth2.OAuth2FailureHandler;
import com.nyo.global.oauth2.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

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
    private final OAuth2FailureHandler oAuth2FailureHandler;

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    // 💡 PasswordEncoder 빈은 순환 참조를 피하기 위해 PasswordEncoderConfig로 분리했습니다.

    // 프론트가 별도 origin(localhost:3000)에서 Authorization 헤더를 실어 호출하므로 CORS 허용이 필요
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
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                // 로그인 전 상태에서 호출되는 회원가입/로그인/실시간 중복체크 API (JWT가 있을 수 없으니 인증 제외)
                                "/api/users/signup", "/api/users/login",
                                "/api/users/check-login-id", "/api/users/check-email", "/api/users/check-nickname",
                                "/oauth2/**", "/login/oauth2/**",   // 구글 로그인 리다이렉트 경로는 인증 없이 통과
                                "/docs/**", "/swagger-ui/**", "/v3/api-docs/**",  // 💡 springdoc 경로가 /docs로 되어있어서 반영
                                "/api/lectures/**"  // TODO: 강의 컨트롤러에 실제 인증 붙으면 이 줄 제거
                        ).permitAll()
                        // 관리자 전용 API (AdminUserController 등) - JwtAuthenticationFilter가 매 요청마다
                        // DB에서 최신 role을 조회해 인증 정보를 만들기 때문에, 권한이 바뀌면 다음 요청부터 바로 반영됨
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated() // 그 외 전부 JWT 인증 필요 (마이페이지 등)
                )
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}