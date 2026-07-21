package com.nyo.global.security;

import com.nyo.global.jwt.JwtAuthenticationFilter;
import com.nyo.global.oauth2.CustomOAuth2UserService;
import com.nyo.global.oauth2.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

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

    // 💡 UserService에서 password.encode()/matches()로 쓸 BCrypt Bean
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // JWT는 세션 안 씀
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/users/signup", "/api/users/login",
                                "/api/users/check-login-id", "/api/users/check-email", "/api/users/check-nickname",
                                "/oauth2/**", "/login/oauth2/**",   // 구글 로그인 리다이렉트 경로는 인증 없이 통과
                                "/docs/**", "/swagger-ui/**", "/v3/api-docs/**"
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