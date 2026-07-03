package com.nyo.global.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * TODO: 4단계(로그인/JWT 인증)에서 제대로 교체할 임시 설정.
 * spring-boot-starter-security 의존성이 있으면 기본적으로 모든 요청에 로그인이 필요해져서
 * (매번 랜덤 생성되는 비밀번호로 인증해야 함) 지금 단계에서는 전부 허용해두고
 * CORS 연결 테스트부터 먼저 확인하기 위한 설정입니다.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

        return http.build();
    }
}