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
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
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

    // 💡 application.yml의 CORS 허용 도메인 리스트를 주입받음
    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

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
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/users/signup", "/api/users/login",
                                "/api/users/check-login-id", "/api/users/check-email", "/api/users/check-nickname",
                                "/oauth2/**", "/login/oauth2/**",   // 구글 로그인 리다이렉트 경로는 인증 없이 통과
                                "/docs/**", "/swagger-ui/**", "/v3/api-docs/**"  // 💡 springdoc 경로가 /docs로 되어있어서 반영
                        ).permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN") // TODO: 관리자 파트 구현 시 활성화
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}