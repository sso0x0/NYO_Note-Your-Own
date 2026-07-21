package com.nyo.global.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

// PasswordEncoder를 SecurityConfig에서 분리한 이유: UserService(PasswordEncoder 필요) →
// SecurityConfig(CustomOAuth2UserService 필요) → CustomOAuth2UserService(UserService 필요) 순으로
// 순환 참조가 생겨 애플리케이션이 기동조차 되지 않았다. SecurityConfig와 무관하게 독립적으로 뜰 수 있는
// 빈이라 별도 설정 클래스로 빼서 순환을 끊는다.
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
